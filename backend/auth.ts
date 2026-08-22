import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import { twoFactor, emailOTP, oneTap, oauthPopup } from "better-auth/plugins";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "Aurelian <onboarding@resend.dev>";

const getBaseURL = () => {
    if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    if (process.env.APP_URL) return process.env.APP_URL;
    return "http://localhost:3000";
};

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
            twoFactor: schema.twoFactor
        }
    }),
    logger: {
        level: 'debug'
    },
    baseURL: getBaseURL(),
    trustedOrigins: [
        process.env.BETTER_AUTH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        "http://localhost:3000",
        "http://localhost:5173",
    ].filter(Boolean) as string[],
    advanced: {
        useSecureCookies: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
        defaultCookieAttributes: {
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
            httpOnly: true,
        }
    },
    emailAndPassword: {  
        enabled: true,
        minPasswordLength: 4,
        sendResetPassword: async ({ user, url, token }, request) => {
            console.log(`[Email] Password reset link for ${user.email}: ${url}`);
            if (resend) {
                try {
                    await resend.emails.send({
                        from: EMAIL_FROM,
                        to: user.email,
                        subject: "Reset your Aurelian password",
                        html: `
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0c; color: #ffffff; padding: 40px 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #262626;">
                            <div style="text-align: center; margin-bottom: 28px;">
                              <h1 style="color: #E5C378; letter-spacing: 4px; font-size: 24px; margin: 0; text-transform: uppercase;">AURELIAN</h1>
                              <p style="color: #888888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Luxury Grooming & Styling</p>
                            </div>
                            <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">Password Reset Request</h2>
                            <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                              We received a request to reset your Aurelian account password. Click the button below to choose a new password:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                              <a href="${url}" style="background: linear-gradient(135deg, #E5C378, #C4972A); color: #0a0a0a; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Reset Password</a>
                            </div>
                            <p style="color: #666666; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #1f1f1f; padding-top: 16px;">
                              If you didn't make this request, you can safely ignore this email. The link will expire shortly.
                            </p>
                          </div>
                        `
                    });
                    console.log(`[Resend] Password reset email sent successfully to ${user.email}`);
                } catch (err) {
                    console.error(`[Resend Error] Failed to send reset email to ${user.email}:`, err);
                }
            }
        },
    },
    socialProviders: {
        ...(process.env.GITHUB_CLIENT_ID ? {
            github: {
                clientId: process.env.GITHUB_CLIENT_ID as string,
                clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            }
        } : {}),
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER"
            },
            twoFactorEnabled: {
                type: "boolean",
                required: false,
                defaultValue: false
            }
        }
    },
    plugins: [
        twoFactor({
            issuer: "Aurelian Access"
        }),
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                console.log(`[Email OTP] Action: ${type} | To: ${email} | OTP: ${otp}`);
                if (resend) {
                    try {
                        const titles: Record<string, string> = {
                            "sign-in": "Sign In Verification",
                            "email-verification": "Verify Your Email",
                            "forget-password": "Reset Password Verification",
                        };
                        const descriptions: Record<string, string> = {
                            "sign-in": "Use the one-time passcode below to securely sign in to your Aurelian account:",
                            "email-verification": "Use the one-time passcode below to verify your email address with Aurelian:",
                            "forget-password": "Use the one-time passcode below to verify your request to reset your password:",
                        };

                        await resend.emails.send({
                            from: EMAIL_FROM,
                            to: email,
                            subject: `${otp} is your Aurelian verification code`,
                            html: `
                              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0c; color: #ffffff; padding: 40px 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #262626;">
                                <div style="text-align: center; margin-bottom: 28px;">
                                  <h1 style="color: #E5C378; letter-spacing: 4px; font-size: 24px; margin: 0; text-transform: uppercase;">AURELIAN</h1>
                                  <p style="color: #888888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Luxury Grooming & Styling</p>
                                </div>
                                <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #ffffff; text-align: center;">${titles[type] || "Verification Code"}</h2>
                                <p style="color: #cccccc; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 28px;">
                                  ${descriptions[type] || "Use the code below to complete your verification:"}
                                </p>
                                <div style="background-color: #141414; border: 1px solid #E5C378; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #E5C378; display: inline-block;">${otp}</span>
                                </div>
                                <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 20px;">
                                  This code will expire in <strong>5 minutes</strong>. Never share this code with anyone.
                                </p>
                                <p style="color: #555555; font-size: 11px; text-align: center; margin-top: 28px; border-top: 1px solid #1f1f1f; padding-top: 16px;">
                                  If you did not request this code, please ignore this email or contact support.
                                </p>
                              </div>
                            `
                        });
                        console.log(`[Resend] OTP email sent successfully to ${email}`);
                    } catch (err) {
                        console.error(`[Resend Error] Failed to send OTP email to ${email}:`, err);
                    }
                }
            },
        }),
        oneTap({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
        }),
        oauthPopup()
    ]
});

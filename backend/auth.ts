import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import { twoFactor, emailOTP, oneTap, oauthPopup } from "better-auth/plugins";

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
    baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000",
    emailAndPassword: {  
        enabled: true,
        minPasswordLength: 4,
        sendResetPassword: async ({ user, url, token }, request) => {
            console.log(`[Email Mock] Password reset link for ${user.email}: ${url}`);
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
            },
        }),
        oneTap({
            clientId: process.env.GOOGLE_CLIENT_ID || "746469864617-u982sdj01nksir0dqgohgmkj8op44bdj.apps.googleusercontent.com",
        }),
        oauthPopup()
    ]
});

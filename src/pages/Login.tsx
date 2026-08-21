import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import GoogleOneTap from '../components/GoogleOneTap';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [loginMethod, setLoginMethod] = useState<'password' | 'email_otp'>('password');
  const [otpStep, setOtpStep] = useState<'email' | 'otp'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setServerError('');
    
    const { data: signInData, error: authError } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    
    if (authError?.status === 403 || authError?.code === "TWO_FACTOR_REQUIRED") {
      setNeeds2FA(true);
    } else if (authError) {
      setServerError(authError.message || 'Login failed');
    } else if ((signInData as any)?.twoFactorRedirect) {
       setNeeds2FA(true);
    } else {
      window.location.href = '/booking';
    }
    setLoading(false);
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError('');

    const { error } = await authClient.twoFactor.verifyTotp({
      code: twoFactorCode
    });

    if (error) {
      setServerError(error.message || 'Invalid 2FA code');
    } else {
      window.location.href = '/booking';
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/booking"
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return;
    setLoading(true);
    setServerError('');
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: otpEmail,
      type: 'sign-in'
    });
    if (error) {
      setServerError(error.message || 'Failed to send OTP');
    } else {
      setOtpStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtpCode) return;
    setLoading(true);
    setServerError('');
    const { data, error } = await authClient.signIn.emailOtp({
      email: otpEmail,
      otp: emailOtpCode
    });
    if (error) {
      setServerError(error.message || 'Invalid OTP code');
    } else if ((data as any)?.twoFactorRedirect) {
      setNeeds2FA(true);
    } else {
      window.location.href = '/booking';
    }
    setLoading(false);
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-5 py-4 bg-[#0a0a0a] border rounded-xl ${hasError ? 'border-red-500/50' : 'border-[#ffffff15]'} text-white placeholder-[#555] focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.08)] font-sans text-sm transition-all`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="bg-[#0a0a0a] border border-[#ffffff15] rounded-3xl p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-60" />
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-white mb-3 italic tracking-tight">Welcome Back</h1>
          <p className="font-sans text-[11px] uppercase tracking-widest text-[#888]">
            Client Portal
          </p>
        </div>

        {serverError && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-4 mb-6 text-[11px] text-red-400 bg-red-900/20 border border-red-500/20 uppercase tracking-widest text-center rounded-xl"
          >
            {serverError}
          </motion.div>
        )}

        {needs2FA ? (
          <form onSubmit={handle2FASubmit} className="flex flex-col gap-6">
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">Authenticator Code</label>
              <input
                type="text"
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000000"
                className={`${inputClass(false)} text-center tracking-[0.5em] text-lg`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              <ArrowRight size={14} />
            </motion.button>
            <button
              type="button"
              onClick={() => setNeeds2FA(false)}
              className="w-full py-2 text-[#888] font-sans text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            {loginMethod === 'password' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div>
                  <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">
                    <Mail size={12} /> Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={inputClass(!!errors.email)}
                    placeholder="your@email.com"
                  />
                  {errors.email && <span className="text-red-400 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.email.message}</span>}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3 ml-1">
                    <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059]">
                      <Lock size={12} /> Password
                    </label>
                    <Link to="/forgot-password" className="font-sans text-[9px] uppercase tracking-widest text-[#888] hover:text-[#C5A059] transition-colors">Forgot?</Link>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={inputClass(!!errors.password)}
                    placeholder="••••••••"
                  />
                  {errors.password && <span className="text-red-400 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.password.message}</span>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Secure Log In'}
                  <ArrowRight size={14} />
                </motion.button>
              </form>
            ) : (
              <form onSubmit={otpStep === 'email' ? handleSendOtp : handleVerifyOtp} className="flex flex-col gap-5">
                {otpStep === 'email' ? (
                  <div>
                    <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">
                      <Mail size={12} /> Email for OTP
                    </label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className={inputClass(false)}
                      placeholder="your@email.com"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">
                      <Lock size={12} /> Enter OTP from Email
                    </label>
                    <input
                      type="text"
                      required
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value)}
                      placeholder="000000"
                      className={`${inputClass(false)} text-center tracking-[0.5em] text-lg`}
                    />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : otpStep === 'email' ? 'Send OTP' : 'Verify & Log In'}
                  <ArrowRight size={14} />
                </motion.button>
                {otpStep === 'otp' && (
                  <button
                    type="button"
                    onClick={() => setOtpStep('email')}
                    className="w-full py-2 text-[#888] font-sans text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Back to Email
                  </button>
                )}
              </form>
            )}

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod(loginMethod === 'password' ? 'email_otp' : 'password');
                  setServerError('');
                }}
                className="font-sans text-[10px] uppercase tracking-widest text-[#888] hover:text-white transition-colors underline decoration-[#ffffff20] underline-offset-4"
              >
                {loginMethod === 'password' ? 'Log In With Email OTP Instead' : 'Log In With Password Instead'}
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-[#ffffff10]"></div>
              <span className="font-sans text-[9px] uppercase tracking-widest text-[#555]">Or Continue With</span>
              <div className="h-[1px] flex-1 bg-[#ffffff10]"></div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-center">
                <div id="google-signin-button-container" className="w-full flex justify-center [&_iframe]:!w-full [&_iframe]:!max-w-full"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#111] border border-[#ffffff15] rounded-xl hover:border-[#ffffff30] transition-all text-white font-sans text-[10px] uppercase tracking-widest"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#111] border border-[#ffffff15] rounded-xl hover:border-[#ffffff30] transition-all text-white font-sans text-[10px] uppercase tracking-widest"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </motion.button>
              </div>
            </div>
            
            <p className="mt-8 text-center font-sans text-[11px] uppercase tracking-widest text-[#555]">
              New Client? <Link to="/register" className="text-[#C5A059] hover:text-[#d4b06a] ml-2 transition-colors">Request Access</Link>
            </p>
          </>
        )}
      </div>

      <GoogleOneTap callbackURL="/booking" />
    </motion.div>
  );
}

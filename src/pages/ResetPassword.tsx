import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    setServerError('');
    
    // better-auth automatically picks up the ?token= from the URL
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
    });
    
    if (error) {
      setServerError(error.message || 'Failed to reset password');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-60" />
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-white mb-3 italic tracking-tight">New Password</h1>
          <p className="font-sans text-[11px] uppercase tracking-widest text-[#888]">
            Secure your account
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

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center space-y-6"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/30">
                <CheckCircle size={28} className="text-[#C5A059]" />
              </div>
            </div>
            <div className="p-5 text-[11px] text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 uppercase tracking-widest leading-relaxed rounded-xl">
              Password has been reset successfully. Redirecting to login...
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div>
              <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">
                <Lock size={12} /> New Password
              </label>
              <input
                type="password"
                {...register('password')}
                className={inputClass(!!errors.password)}
                placeholder="••••••••"
              />
              {errors.password && <span className="text-red-400 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.password.message}</span>}
            </div>

            <div>
              <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] mb-3 ml-1">
                <Lock size={12} /> Confirm Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={inputClass(!!errors.confirmPassword)}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="text-red-400 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.confirmPassword.message}</span>}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Reset Password'}
              <ArrowRight size={14} />
            </motion.button>
          </form>
        )}
        
        {!success && (
          <p className="mt-8 text-center font-sans text-[11px] uppercase tracking-widest text-[#555]">
            <Link to="/login" className="text-[#C5A059] hover:text-[#d4b06a] transition-colors">Return to Login →</Link>
          </p>
        )}
      </div>
    </motion.div>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setServerError('');
    
    const { error } = await (authClient as any).forgetPassword({
      email: data.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      setServerError(error.message || 'Failed to send reset link');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-5 py-3.5 bg-[var(--color-input-bg)] border rounded-xl ${hasError ? 'border-red-500/50' : 'border-[var(--color-border)]'} text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(229,195,120,0.15)] font-sans text-sm transition-all`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-60" />
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-[var(--color-primary-text)] mb-3 italic tracking-tight font-serif">Reset Access</h1>
          <p className="font-sans text-[11px] uppercase tracking-widest text-[var(--color-secondary-text)] font-semibold">
            Recover your account
          </p>
        </div>

        {serverError && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-4 mb-6 text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 uppercase tracking-widest text-center rounded-xl font-semibold"
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
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/30">
                <CheckCircle size={28} className="text-[var(--color-primary)]" />
              </div>
            </div>
            <div className="p-5 text-[11px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 uppercase tracking-widest leading-relaxed rounded-xl font-semibold">
              A reset link has been sent to your email. Check your console during development.
            </div>
            <Link to="/login" className="inline-block text-[11px] uppercase tracking-widest text-[var(--color-primary)] hover:underline transition-colors font-bold">
              Return to Login →
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div>
              <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3 ml-1 font-semibold">
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className={inputClass(!!errors.email)}
                placeholder="your@email.com"
              />
              {errors.email && <span className="text-red-500 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.email.message}</span>}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--color-primary)] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
              <ArrowRight size={14} />
            </motion.button>

            <div className="text-center mt-2">
              <Link to="/login" className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

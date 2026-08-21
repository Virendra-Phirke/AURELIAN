import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import GoogleOneTap from '../components/GoogleOneTap';
import { BorderBeam } from '../components/magicui/border-beam';
import { signInWithOAuthPopup } from '../lib/oauthPopup';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setServerError('');
    
    const { error: authError } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    
    if (authError) {
      setServerError(authError.message || 'Registration failed');
    } else {
      navigate('/booking');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await signInWithOAuthPopup(provider, '/booking');
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
        <BorderBeam size={160} duration={12} colorFrom="var(--color-primary)" borderWidth={1.5} />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-60" />
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-[var(--color-primary-text)] mb-3 italic tracking-tight font-serif">Become a Client</h1>
          <p className="font-sans text-[11px] uppercase tracking-widest text-[var(--color-secondary-text)] font-medium">
            Create an Account
          </p>
        </div>

        {serverError && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-4 mb-6 text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 uppercase tracking-widest text-center rounded-xl"
          >
            {serverError}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3 ml-1 font-semibold">
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              autoComplete="name"
              {...register('name')}
              className={inputClass(!!errors.name)}
              placeholder="John Doe"
            />
            {errors.name && <span className="text-red-500 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.name.message}</span>}
          </div>
          <div>
            <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3 ml-1 font-semibold">
              <Mail size={12} /> Email
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
          <div>
            <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3 ml-1 font-semibold">
              <Lock size={12} /> Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className={inputClass(!!errors.password)}
              placeholder="••••••••"
            />
            {errors.password && <span className="text-red-500 text-[10px] uppercase tracking-wider mt-2 block ml-1">{errors.password.message}</span>}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 bg-[var(--color-primary)] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(229,195,120,0.25)] flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            {loading ? 'Processing...' : 'Create Account'}
            <ArrowRight size={14} />
          </motion.button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-[var(--color-border)]"></div>
          <span className="font-sans text-[9px] uppercase tracking-widest text-[var(--color-muted-text)] font-semibold">Or Continue With</span>
          <div className="h-[1px] flex-1 bg-[var(--color-border)]"></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2.5 py-3.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-xl transition-all text-[var(--color-primary-text)] font-sans text-[11px] uppercase tracking-widest font-semibold shadow-sm cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2.5 py-3.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-xl transition-all text-[var(--color-primary-text)] font-sans text-[11px] uppercase tracking-widest font-semibold shadow-sm cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </motion.button>
        </div>
        
        <p className="mt-8 text-center font-sans text-[11px] uppercase tracking-widest text-[var(--color-secondary-text)]">
          Existing Client? <Link to="/login" className="text-[var(--color-primary)] hover:underline ml-2 transition-colors font-semibold">Log In</Link>
        </p>
      </div>

      <GoogleOneTap callbackURL="/booking" />
    </motion.div>
  );
}

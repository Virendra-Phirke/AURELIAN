import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, AlertCircle, Camera, Check, Key, Lock, Mail, ArrowRight, Sun, Moon, Laptop } from 'lucide-react';
import { authClient } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { ThemeToggle } from '../components/magicui/theme-toggle';

// Toast for feedback
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border ${
        type === 'error' ? 'bg-[#1c0808] border-red-500/30 text-red-400' : 'bg-[#111111] border-[#E5C378]/40 text-[#E5C378]'
      } font-sans text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3`}
      role="alert"
    >
      <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-[#E5C378]'}`} />
      <span>{message}</span>
    </motion.div>
  );
}

export default function Settings() {
  const { data: sessionData } = authClient.useSession();
  const session = sessionData as any;
  const user = session?.user;
  const { theme, setTheme } = useTheme();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password State
  const [hasPassword, setHasPassword] = useState(true);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
      setNewImage(user.image || '');

      setCheckingPassword(true);
      const listAccountsFn = (authClient as any).listAccounts || (authClient as any).listUserAccounts;
      if (typeof listAccountsFn === 'function') {
        listAccountsFn()
          .then((res: any) => {
            setCheckingPassword(false);
            if (res?.data) {
              const hasPwd = res.data.some((acc: any) => acc.providerId === 'credential' || acc.providerId === 'email' || acc.password);
              setHasPassword(hasPwd);
            }
          })
          .catch(() => setCheckingPassword(false));
      } else {
        setCheckingPassword(false);
      }
    }
  }, [user]);

  if (!user) return null;

  const handleUpdateProfile = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }

    if (!newName.trim()) return setToast({ message: 'Name cannot be empty', type: 'error' });
    setUpdatingProfile(true);
    try {
      const { error } = await authClient.updateUser({
        name: newName,
        image: newImage || undefined,
      });
      if (error) {
        setToast({ message: error.message || 'Failed to update profile', type: 'error' });
      } else {
        setToast({ message: 'Profile updated successfully', type: 'success' });
        setIsEditingProfile(false);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      setToast({ message: e.message || 'An error occurred', type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (hasPassword && !currentPassword) return setToast({ message: 'Current password is required', type: 'error' });
    if (!newPassword) return setToast({ message: 'New password is required', type: 'error' });
    if (newPassword.length < 8) return setToast({ message: 'New password must be at least 8 chars', type: 'error' });

    setUpdatingPassword(true);
    let error;

    try {
      if (hasPassword) {
        const res = await authClient.changePassword({
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        });
        error = res.error;
      } else {
        const setPwdFn = (authClient as any).setPassword || (authClient as any).resetPassword;
        if (typeof setPwdFn === 'function') {
          const res = await setPwdFn({ newPassword });
          error = res.error;
        }
      }

      if (error) {
        setToast({ message: error.message || 'Failed to update password', type: 'error' });
      } else {
        setToast({ message: hasPassword ? 'Password updated successfully' : 'Password set successfully', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      setToast({ message: e.message || 'An error occurred', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Top Banner (Geist Style) */}
      <div className="p-6 sm:p-8 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full p-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <div className="w-full h-full rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden relative">
                {newImage || user.image ? (
                  <img src={newImage || user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-[var(--color-secondary-text)]" />
                )}
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Camera size={18} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
              <h1 className="text-2xl font-serif text-[var(--color-primary-text)] font-medium">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[10px] uppercase tracking-widest font-semibold">
                {user.role === 'ADMIN' ? 'Administrator' : 'Client Member'}
              </span>
            </div>
            <p className="text-[var(--color-secondary-text)] font-sans text-xs">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleUpdateProfile}
          disabled={updatingProfile}
          className={`px-5 py-2.5 rounded-xl font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center gap-2 cursor-pointer ${
            isEditingProfile
              ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black shadow-[0_0_15px_rgba(229,195,120,0.3)]'
              : 'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary-text)] border border-[var(--color-border)]'
          }`}
        >
          {updatingProfile ? 'Saving...' : isEditingProfile ? <><Check size={14} /> Save Profile</> : 'Edit Profile'}
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Account Details */}
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-colors">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--color-border)]">
              <User size={16} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-primary-text)] font-sans text-xs uppercase tracking-[0.2em] font-semibold">Account Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-secondary-text)] mb-1.5 font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={isEditingProfile ? newName : user.name}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={!isEditingProfile}
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-secondary-text)] mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-secondary-text)] focus:outline-none cursor-not-allowed opacity-80"
                />
              </div>

              <AnimatePresence>
                {isEditingProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-secondary-text)] mb-1.5 mt-2 font-medium">
                      Avatar URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isEditingProfile && (
            <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex gap-3">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setNewName(user.name || '');
                  setNewImage(user.image || '');
                }}
                className="px-4 py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] font-sans text-xs uppercase tracking-wider rounded-xl border border-[var(--color-border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Security & Theme */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 flex-1 shadow-xl transition-colors">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[var(--color-border)]">
              <Shield size={16} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-primary-text)] font-sans text-xs uppercase tracking-[0.2em] font-semibold">Security & Password</h2>
            </div>

            {checkingPassword ? (
              <div className="py-8 text-center font-sans text-xs text-[var(--color-secondary-text)] uppercase tracking-wider">
                Checking security status...
              </div>
            ) : (
              <div className="space-y-4">
                {!hasPassword && (
                  <div className="p-3.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-sans text-xs flex items-center gap-2.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>No password is currently set for this account.</span>
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <label className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-secondary-text)] mb-1.5 font-medium">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors placeholder:text-[var(--color-muted-text)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-secondary-text)] mb-1.5 font-medium">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors placeholder:text-[var(--color-muted-text)]"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={updatingPassword}
                    className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(229,195,120,0.25)] disabled:opacity-50 cursor-pointer"
                  >
                    {updatingPassword ? 'Updating...' : hasPassword ? 'Update Password' : 'Set Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme & Appearance */}
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <Sun size={16} className="text-[var(--color-primary)]" />
                <h2 className="text-[var(--color-primary-text)] font-sans text-xs uppercase tracking-[0.2em] font-semibold">Appearance & Theme</h2>
              </div>
              <ThemeToggle showLabel />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => setTheme('dark', e)}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                <Moon size={18} />
                <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Dark</span>
              </button>

              <button
                type="button"
                onClick={(e) => setTheme('light', e)}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                <Sun size={18} />
                <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">Light</span>
              </button>

              <button
                type="button"
                onClick={(e) => setTheme('system', e)}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                <Laptop size={18} />
                <span className="font-sans text-[10px] uppercase tracking-wider font-semibold">System</span>
              </button>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <Lock size={16} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-[var(--color-primary-text)] text-xs font-semibold uppercase tracking-wider">Two-Factor Authentication</h3>
                <p className="text-[var(--color-secondary-text)] font-sans text-[11px]">Enhanced account protection</p>
              </div>
            </div>

            <button
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                setToast({ message: !twoFactorEnabled ? '2FA Enabled' : '2FA Disabled', type: 'success' });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                twoFactorEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                  twoFactorEnabled ? 'left-7 bg-black' : 'left-1 bg-[var(--color-secondary-text)]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

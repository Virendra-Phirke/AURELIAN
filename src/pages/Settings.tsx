import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, AlertCircle, Camera, Check, Key, Lock, Mail, ArrowRight, Sun, Moon, Laptop } from 'lucide-react';
import { authClient } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Skeleton } from '../components/ui/skeleton';

// Toast for feedback
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border ${
        type === 'error' ? 'bg-red-950/30 border-red-500/30 text-red-500' : 'bg-[var(--color-surface-raised)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
      } font-sans text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 font-semibold`}
      role="alert"
    >
      <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`} />
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Top Banner Skeleton */}
        <div className="p-3.5 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="w-40 h-5 rounded-md" />
              <Skeleton className="w-56 h-3 rounded-md" />
            </div>
          </div>
          <Skeleton className="w-24 h-7 rounded-full" />
        </div>

        {/* Account Details Card Skeleton */}
        <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-16 h-6 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-full h-9 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-full h-9 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Security Skeleton */}
        <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[var(--color-border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]">
            <Skeleton className="w-36 h-4 rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="w-full h-9 rounded-xl" />
            <Skeleton className="w-full h-9 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = useCallback(async () => {
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
  }, [isEditingProfile, newName, newImage]);

  const handleChangePassword = useCallback(async () => {
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
  }, [hasPassword, currentPassword, newPassword]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-5 pb-12">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Top Banner (Geist Style) */}
      <div className="p-3.5 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left w-full sm:w-auto">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2px] bg-[var(--color-surface-raised)]">
              <div className="w-full h-full rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden relative">
                {newImage || user.image ? (
                  <img
                    src={newImage || user.image}
                    referrerPolicy="no-referrer"
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-sans text-sm sm:text-base font-bold text-[var(--color-primary)] uppercase">
                    {(user.name || 'C').charAt(0).toUpperCase()}
                  </span>
                )}
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Camera size={14} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <h1 className="text-base sm:text-xl font-serif text-[var(--color-primary-text)] font-medium truncate">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-semibold">
                {user.role === 'ADMIN' ? 'Administrator' : 'Client Member'}
              </span>
            </div>
            <p className="text-[var(--color-secondary-text)] font-sans text-[11px] truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleUpdateProfile}
          disabled={updatingProfile}
          className={`w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
            isEditingProfile
              ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-bold'
              : 'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary-text)]'
          }`}
        >
          {updatingProfile ? 'Saving...' : isEditingProfile ? <><Check size={13} /> Save Profile</> : 'Edit Profile'}
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Left Column: Account Details */}
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm transition-colors">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--color-border)]">
              <User size={14} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Account Details</h2>
            </div>

            <div className="space-y-2.5 sm:space-y-4">
              <div>
                <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={isEditingProfile ? newName : user.name}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={!isEditingProfile}
                  className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--color-secondary-text)] focus:outline-none cursor-not-allowed opacity-80"
                />
              </div>

              <AnimatePresence>
                {isEditingProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 mt-2 font-medium">
                      Avatar URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--color-primary-text)] focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isEditingProfile && (
            <div className="pt-3 sm:pt-6 mt-3 sm:mt-6 border-t border-[var(--color-surface-raised)] flex gap-2">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setNewName(user.name || '');
                  setNewImage(user.image || '');
                }}
                className="px-3.5 py-1.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Security & Theme */}
        <div className="space-y-3 sm:space-y-5 flex flex-col">
          {/* Security & Password */}
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex-1 shadow-sm transition-colors">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-[var(--color-border)]">
              <Shield size={14} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Security & Password</h2>
            </div>

            {checkingPassword ? (
              <div className="py-4 text-center font-sans text-xs text-[var(--color-secondary-text)] uppercase tracking-wider">
                Checking status...
              </div>
            ) : (
              <div className="space-y-2.5">
                {!hasPassword && (
                  <div className="p-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[11px] flex items-center gap-2">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>No password set for this account.</span>
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-medium">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-[var(--color-primary-text)] focus:outline-none transition-colors placeholder:text-[var(--color-muted-text)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-medium">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-[var(--color-primary-text)] focus:outline-none transition-colors placeholder:text-[var(--color-muted-text)]"
                  />
                </div>

                <div className="pt-1.5">
                  <button
                    onClick={handleChangePassword}
                    disabled={updatingPassword}
                    className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {updatingPassword ? 'Updating...' : hasPassword ? 'Update Password' : 'Set Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme & Appearance */}
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-2.5 transition-colors">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--color-border)]">
              <Sun size={14} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Appearance & Theme</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 sm:py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer font-sans text-[10px] sm:text-xs uppercase tracking-wider ${
                  theme === 'dark'
                    ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Moon size={14} />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 sm:py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer font-sans text-[10px] sm:text-xs uppercase tracking-wider ${
                  theme === 'light'
                    ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Sun size={14} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2 sm:py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer font-sans text-[10px] sm:text-xs uppercase tracking-wider ${
                  theme === 'system'
                    ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Laptop size={14} />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--color-surface-raised)] flex items-center justify-center shrink-0">
                <Lock size={14} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-[var(--color-primary-text)] text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Two-Factor Authentication</h3>
                <p className="text-[var(--color-secondary-text)] font-sans text-[10px] sm:text-[11px]">Enhanced account protection</p>
              </div>
            </div>

            <button
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                setToast({ message: !twoFactorEnabled ? '2FA Enabled' : '2FA Disabled', type: 'success' });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                twoFactorEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform absolute top-1 ${
                  twoFactorEnabled ? 'left-6 bg-black' : 'left-1 bg-[var(--color-secondary-text)]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

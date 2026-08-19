import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, AlertCircle, Camera, Check } from 'lucide-react';
import { authClient } from '../lib/auth';

// Toast for feedback
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl border ${type === 'error' ? 'bg-[#2a0808] border-red-500/30 text-red-400' : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059]'} font-sans text-xs uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center gap-3`}
      role="alert"
    >
      <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'error' ? 'bg-red-500' : 'bg-[#C5A059]'}`} />
      {message}
    </motion.div>
  );
}

export default function Settings() {
  const { data: sessionData } = authClient.useSession();
  const session = sessionData as any;
  const user = session?.user;

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

  // 2FA State (Mock for now)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
      setNewImage(user.image || '');
      
      setCheckingPassword(true);
      authClient.listUserAccounts().then((res) => {
        setCheckingPassword(false);
        if (res.data) {
          const hasPwd = res.data.some((acc: any) => acc.providerId === 'credential' || acc.providerId === 'email' || acc.password);
          setHasPassword(hasPwd);
        }
      }).catch(() => setCheckingPassword(false));
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
        const res = await authClient.setPassword({
          newPassword,
        });
        error = res.error;
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
    <div className="w-full space-y-6">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Top Banner (Avatar & Basic Info) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C5A059]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-[#C5A059] to-[#C5A059]/20 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden relative">
              {newImage || user.image ? (
                <img src={newImage || user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-[#888]" />
              )}
              {isEditingProfile && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left z-10">
          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">{user.name}</h1>
          <p className="text-[#888] font-sans text-[11px] uppercase tracking-[0.2em] mb-4">{user.email}</p>
          
          <div className="inline-flex px-4 py-1.5 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] font-sans text-[9px] uppercase tracking-[0.2em]">
            {user.role === 'ADMIN' ? 'Administrator' : 'Client'}
          </div>
        </div>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Account Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#ffffff10]">
            <User size={16} className="text-[#C5A059]" />
            <h2 className="text-[#C5A059] font-sans text-[10px] uppercase tracking-[0.3em]">Account Details</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">Full Name</label>
              <input 
                type="text" 
                value={isEditingProfile ? newName : user.name}
                onChange={e => setNewName(e.target.value)}
                disabled={!isEditingProfile}
                className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#D4D4D4] focus:outline-none focus:border-[#C5A059]/50 transition-colors font-light disabled:opacity-70"
              />
            </div>
            
            <div>
              <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                value={user.email}
                disabled
                className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#888] focus:outline-none transition-colors font-light disabled:opacity-50"
              />
            </div>

            <AnimatePresence>
              {isEditingProfile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1 mt-6">Avatar URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newImage}
                    onChange={e => setNewImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#D4D4D4] focus:outline-none focus:border-[#C5A059]/50 transition-colors font-light"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-8 border-t border-[#ffffff10] flex gap-4">
            <button 
              onClick={handleUpdateProfile}
              disabled={updatingProfile}
              className={`px-8 py-3 rounded-2xl font-sans text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                isEditingProfile 
                  ? 'bg-[#C5A059] text-black hover:bg-[#d4b06a] shadow-[0_0_20px_rgba(197,160,89,0.2)]' 
                  : 'bg-transparent border border-[#ffffff20] text-[#D4D4D4] hover:bg-[#ffffff05]'
              }`}
            >
              {updatingProfile ? 'Saving...' : isEditingProfile ? <><Check size={14} /> Save Profile</> : 'Edit Profile'}
            </button>
            
            {isEditingProfile && (
              <button 
                onClick={() => {
                  setIsEditingProfile(false);
                  setNewName(user.name || '');
                  setNewImage(user.image || '');
                }}
                className="px-8 py-3 rounded-2xl bg-transparent border border-[#ffffff20] text-[#888] font-sans text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Column: Security */}
        <div className="space-y-6 flex flex-col">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 flex-1"
          >
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#ffffff10]">
              <Shield size={16} className="text-[#C5A059]" />
              <h2 className="text-[#C5A059] font-sans text-[10px] uppercase tracking-[0.3em]">Security</h2>
            </div>

            {checkingPassword ? (
              <div className="text-[#888] font-sans text-[10px] uppercase tracking-widest flex h-full items-center justify-center">Checking security status...</div>
            ) : (
              <div className="space-y-6">
                {!hasPassword && (
                  <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] px-5 py-4 rounded-2xl font-sans text-[10px] uppercase tracking-widest flex items-center gap-3 mb-6">
                    <AlertCircle size={16} /> No password is set for this account.
                  </div>
                )}
                
                {hasPassword && (
                  <div>
                    <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#D4D4D4] focus:outline-none focus:border-[#C5A059]/50 transition-colors font-light placeholder:text-[#333]"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#D4D4D4] focus:outline-none focus:border-[#C5A059]/50 transition-colors font-light placeholder:text-[#333]"
                  />
                </div>

                <div className="mt-8 pt-6">
                  <button 
                    onClick={handleChangePassword}
                    disabled={updatingPassword}
                    className="px-8 py-3 bg-[#C5A059] text-black font-sans text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)] disabled:opacity-70"
                  >
                    {updatingPassword ? (hasPassword ? 'Updating...' : 'Setting...') : (hasPassword ? 'Update Password' : 'Set Password')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-[#111] border border-[#ffffff10] flex items-center justify-center shrink-0">
                <Shield size={20} className="text-[#888]" />
              </div>
              <div>
                <h3 className="text-[#D4D4D4] font-serif text-lg mb-1">Two-Factor Authentication</h3>
                <p className="text-[#555] font-sans text-[9px] uppercase tracking-[0.2em]">Add an extra layer of security</p>
              </div>
            </div>
            
            <button 
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${twoFactorEnabled ? 'bg-[#C5A059]' : 'bg-[#333]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${twoFactorEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

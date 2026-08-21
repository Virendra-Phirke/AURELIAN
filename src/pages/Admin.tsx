import React, { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, CalendarDays, Users, Scissors, Settings as SettingsIcon, ChevronRight, ChevronDown, Clock, User, Shield, Lock, AlertCircle, AlertTriangle, Trash2, Power, Camera, Download, Search, RefreshCw, X, Check } from 'lucide-react';
import { authClient } from '../lib/auth';
import { DataPagination } from '../components/ui/pagination';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { NumberTicker } from '../components/magicui/number-ticker';
import { BorderBeam } from '../components/magicui/border-beam';
import { BlurFade } from '../components/magicui/blur-fade';
import { AnimatedList } from '../components/magicui/animated-list';

// --- Types ---
type Booking = {
  id: string;
  userId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  customerNote?: string;
  createdAt: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  bookingCount: number;
};

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
};

type TabKey = 'overview' | 'bookings' | 'customers' | 'services' | 'settings' | 'profile';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { key: 'bookings', label: 'Bookings', icon: <CalendarDays size={20} /> },
  { key: 'customers', label: 'Customers', icon: <Users size={20} /> },
  { key: 'services', label: 'Services', icon: <Scissors size={20} /> },
  { key: 'settings', label: 'Shop Settings', icon: <SettingsIcon size={20} /> },
  { key: 'profile', label: 'My Profile', icon: <User size={20} /> },
];

const STATUS_FILTERS = ['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

// --- Animation Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
};

const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

const listVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const listItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

// --- Confirmation Modal Types & Component ---
type ConfirmModalConfig = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  icon?: 'trash' | 'power' | 'shield' | 'check' | 'alert';
  onConfirm: () => void;
};

function ConfirmationModal({
  config,
  onClose,
}: {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}) {
  if (!config || !config.isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/15 text-red-500 border border-red-500/30',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20',
    },
    warning: {
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      btn: 'bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md shadow-amber-500/20',
    },
    success: {
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      btn: 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20',
    },
    primary: {
      iconBg: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30',
      btn: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-bold shadow-md shadow-[var(--color-primary)]/20',
    },
  }[config.variant || 'primary'];

  return (
    <Dialog open={config.isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent onClose={onClose} className="max-w-[92vw] sm:max-w-md p-5 sm:p-6 rounded-2xl bg-[var(--color-card-bg)] shadow-2xl border border-[var(--color-border)]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 text-center sm:text-left pt-1">
          {/* Icon Badge */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
            {config.icon === 'trash' && <Trash2 size={20} className="sm:w-[22px] sm:h-[22px]" />}
            {config.icon === 'power' && <Power size={20} className="sm:w-[22px] sm:h-[22px]" />}
            {config.icon === 'shield' && <Shield size={20} className="sm:w-[22px] sm:h-[22px]" />}
            {config.icon === 'check' && <Check size={20} className="sm:w-[22px] sm:h-[22px]" />}
            {(!config.icon || config.icon === 'alert') && <AlertTriangle size={20} className="sm:w-[22px] sm:h-[22px]" />}
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <h3 className="font-serif text-base sm:text-lg font-medium text-[var(--color-primary-text)] tracking-tight">
              {config.title}
            </h3>
            <p className="font-sans text-[11px] sm:text-xs text-[var(--color-secondary-text)] leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 mt-4 border-t border-[var(--color-surface-raised)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer text-center"
          >
            {config.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
            className={`w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl font-sans text-[10px] sm:text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-center ${variantStyles.btn}`}
          >
            {config.confirmText || 'Confirm'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Status Badge (Block UI) ---
function StatusBadge({ status }: { status: string }) {
  const isConfirmed = status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'PENDING';
  const displayLabel = isConfirmed ? 'CONFIRMED' : status;
  const colors: Record<string, string> = {
    CONFIRMED: 'text-emerald-500 bg-emerald-500/15 font-bold',
    ACCEPTED: 'text-emerald-500 bg-emerald-500/15 font-bold',
    PENDING: 'text-emerald-500 bg-emerald-500/15 font-bold',
    COMPLETED: 'text-[var(--color-primary-text)] bg-[var(--color-surface-raised)] font-medium',
    CANCELLED: 'text-[var(--color-muted-text)] bg-[var(--color-surface-raised)] font-medium',
    REJECTED: 'text-red-500 bg-red-500/15 font-bold',
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-sans inline-flex items-center gap-1.5 ${colors[status] || colors.CONFIRMED}`}
      role="status"
      aria-label={`Status: ${displayLabel.toLowerCase()}`}
    >
      {displayLabel}
    </span>
  );
}

// --- Stat Card with SVG Sparkline & Magic UI ---
function StatCard({ label, value, icon, accent = false, pathData }: { label: string; value: number | string; icon?: React.ReactNode, accent?: boolean, pathData: string }) {
  const numValue = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(229,195,120,0.15)' }}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] p-2.5 sm:p-6 flex flex-col justify-between min-h-[75px] sm:aspect-[4/3] transition-all group shadow-sm sm:shadow-md"
    >
      {accent && <BorderBeam size={80} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />}
      <div className="flex items-center gap-1.5 sm:gap-2 z-10">
        <div className="text-[var(--color-primary)] scale-75 sm:scale-100">{icon}</div>
        <span className="font-sans text-[8.5px] sm:text-[11px] uppercase tracking-wider font-bold text-[var(--color-secondary-text)] truncate">{label}</span>
      </div>
      <div className={`text-xl sm:text-5xl font-semibold z-10 font-sans tracking-tight mt-0.5 sm:mt-0 ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary-text)]'}`}>
        <NumberTicker value={numValue} />
      </div>
      
      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-16 opacity-30 group-hover:opacity-90 transition-opacity duration-500">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={`${pathData} L100,40 L0,40 Z`}
            fill={`url(#grad-${label.replace(/\s+/g, '')})`}
          />
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={pathData}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}

// --- Toast Notification ---
function Toast({ message, type = 'success', onDone }: { message: string; type?: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl border ${
        type === 'error'
          ? 'bg-[#2a0808] border-red-500/30 text-red-400'
          : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059]'
      } font-sans text-xs uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.8)]`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {type === 'success' ? <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        {message}
      </div>
    </motion.div>
  );
}

// ========================
// Main Admin Component
// ========================
export default function Admin() {
  const { data: sessionData } = authClient.useSession();
  const adminUser = (sessionData as any)?.user;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Filters / Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDuration, setEditServiceDuration] = useState(30);

  // Customer Edit form
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');

  // Pagination State
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPageSize, setBookingPageSize] = useState(10);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(10);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // Confirmation Modal State (Responsive Mobile & Desktop)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);

  // --- Profile & Password State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [hasPassword, setHasPassword] = useState(true);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (adminUser) {
      setNewName(adminUser.name || '');
      setNewImage(adminUser.image || '');
      
      setCheckingPassword(true);
      const listAccountsFn = (authClient as any).listAccounts || (authClient as any).listUserAccounts;
      if (typeof listAccountsFn === 'function') {
        listAccountsFn().then((res: any) => {
          setCheckingPassword(false);
          if (res?.data) {
            const hasPwd = res.data.some((acc: any) => acc.providerId === 'credential' || acc.providerId === 'email' || acc.password);
            setHasPassword(hasPwd);
          }
        }).catch(() => setCheckingPassword(false));
      } else {
        setCheckingPassword(false);
      }
    }
  }, [adminUser]);

  const handleUpdateProfile = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }
    if (!newName.trim()) return showToast('Name cannot be empty', 'error');
    setUpdatingProfile(true);
    try {
      const { error } = await authClient.updateUser({
        name: newName,
        image: newImage || undefined,
      });
      if (error) {
        showToast(error.message || 'Failed to update profile', 'error');
      } else {
        showToast('Profile updated successfully', 'success');
        setIsEditingProfile(false);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      showToast(e.message || 'An error occurred', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (hasPassword && !currentPassword) return showToast('Current password is required', 'error');
    if (!newPassword) return showToast('New password is required', 'error');
    if (newPassword.length < 8) return showToast('New password must be at least 8 chars', 'error');
    
    setUpdatingPassword(true);
    let error;
    try {
      if (hasPassword) {
        const res = await authClient.changePassword({ newPassword, currentPassword, revokeOtherSessions: true });
        error = res.error;
      } else {
        const setPwdFn = (authClient as any).setPassword || (authClient as any).resetPassword;
        if (typeof setPwdFn === 'function') {
          const res = await setPwdFn({ newPassword });
          error = res.error;
        }
      }
      if (error) {
        showToast(error.message || 'Failed to update password', 'error');
      } else {
        showToast(hasPassword ? 'Password updated successfully' : 'Password set successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      showToast(e.message || 'An error occurred', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // --- Tab keyboard navigation ---
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;

    e.preventDefault();
    tabsRef.current[next]?.focus();
    setActiveTab(TABS[next].key);
  };

  // --- Data fetching ---
  const fetchAll = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    Promise.all([
      fetch('/api/admin/bookings').then(r => r.json()),
      fetch('/api/admin/services').then(r => r.json()),
      fetch('/api/admin/customers').then(r => r.json()),
      fetch('/api/shop').then(r => r.json()),
    ]).then(([bData, sData, cData, shopData]) => {
      setBookings(Array.isArray(bData) ? bData : []);
      setAllServices(Array.isArray(sData) ? sData : []);
      const sMap: Record<string, string> = {};
      (Array.isArray(sData) ? sData : []).forEach((s: any) => { sMap[s.id] = s.name; });
      setServiceMap(sMap);
      setCustomers(Array.isArray(cData) ? cData : []);
      setSettings(shopData || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  // --- Customer map for booking display ---
  const customerMap: Record<string, Customer> = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  // --- Booking actions ---
  const handleBookingAction = async (id: string, action: string) => {
    const statusMap: Record<string, string> = {
      accept: 'ACCEPTED',
      reject: 'REJECTED',
      complete: 'COMPLETED',
      cancel: 'CANCELLED',
    };
    const nextStatus = statusMap[action] || action.toUpperCase();

    // Optimistic update (instant response, no full-page reload)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: nextStatus } : b));
    showToast(`Booking ${action}ed`);

    const res = await fetch(`/api/admin/bookings/${id}/${action}`, { method: 'POST' });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      showToast('Failed to update booking', 'error');
    }
  };

  // --- Customer actions ---
  const handleDeleteCustomer = async (id: string) => {
    // Optimistic update
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer deleted');

    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      const data = await res.json();
      showToast(data.error || 'Failed to delete', 'error');
    }
  };

  const handleToggleRole = async (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, role: c.role === 'ADMIN' ? 'USER' : 'ADMIN' } : c));
    showToast('Role updated');

    const res = await fetch(`/api/admin/customers/${id}/role`, { method: 'PATCH' });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      const data = await res.json();
      showToast(data.error || 'Failed to update role', 'error');
    }
  };

  const handleSaveCustomerEdit = async (id: string) => {
    const trimmedName = editCustomerName.trim();
    const trimmedEmail = editCustomerEmail.trim();
    if (!trimmedName) return showToast('Customer name cannot be empty', 'error');

    // Optimistic update
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, name: trimmedName, email: trimmedEmail || c.email } : c));
    setEditingCustomerId(null);
    showToast('Customer updated successfully');

    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail || undefined
      }),
    });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      const data = await res.json();
      showToast(data.error || 'Failed to update customer', 'error');
    }
  };

  // --- Service actions ---
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newServiceName.trim(), durationMinutes: newServiceDuration }),
    });
    if (res.ok) {
      setNewServiceName('');
      setNewServiceDuration(30);
      fetchAll(false);
      showToast('Service created');
    } else {
      showToast('Failed to create service', 'error');
    }
  };

  const handleToggleServiceActive = async (id: string, active: boolean) => {
    // Optimistic UI update (immediate toggle with 0ms delay, no screen reload)
    setAllServices(prev => prev.map(s => s.id === id ? { ...s, active: !active } : s));
    showToast(active ? 'Service deactivated' : 'Service activated');

    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      fetchAll(false);
    } else {
      // Revert if error
      setAllServices(prev => prev.map(s => s.id === id ? { ...s, active: active } : s));
      showToast('Failed to update service', 'error');
    }
  };

  const handleSaveServiceEdit = async (id: string) => {
    const trimmedName = editServiceName.trim();
    if (!trimmedName) return showToast('Service name cannot be empty', 'error');

    // Optimistic UI update (instant, no screen reload)
    setAllServices(prev => prev.map(s => s.id === id ? { ...s, name: trimmedName, durationMinutes: editServiceDuration } : s));
    setServiceMap(prev => ({ ...prev, [id]: trimmedName }));
    setEditingServiceId(null);
    showToast('Service updated');

    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, durationMinutes: editServiceDuration }),
    });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      showToast('Failed to update service', 'error');
    }
  };

  // --- Confirmation Trigger Handlers (Responsive Box) ---
  const requestDeleteCustomer = (c: Customer) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer?',
      description: `Are you sure you want to permanently delete "${c.name}" (${c.email})? All associated customer data and appointment history will be permanently deleted.`,
      confirmText: 'Delete Customer',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => handleDeleteCustomer(c.id),
    });
  };

  const requestToggleRole = (c: Customer) => {
    const isDemoting = c.role === 'ADMIN';
    setConfirmModal({
      isOpen: true,
      title: isDemoting ? `Demote ${c.name}?` : `Promote ${c.name}?`,
      description: isDemoting
        ? `Revoke administrator access from "${c.name}". They will lose access to the admin dashboard and management tools.`
        : `Grant administrator privileges to "${c.name}". They will have full access to manage all bookings, shop services, and customers.`,
      confirmText: isDemoting ? 'Demote to User' : 'Promote to Admin',
      variant: isDemoting ? 'warning' : 'primary',
      icon: 'shield',
      onConfirm: () => handleToggleRole(c.id),
    });
  };

  const requestToggleServiceActive = (s: Service) => {
    if (s.active) {
      setConfirmModal({
        isOpen: true,
        title: `Deactivate ${s.name}?`,
        description: `Are you sure you want to deactivate "${s.name}"? Customers will no longer be able to select and book this service.`,
        confirmText: 'Deactivate Service',
        variant: 'warning',
        icon: 'power',
        onConfirm: () => handleToggleServiceActive(s.id, true),
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: `Activate ${s.name}?`,
        description: `Are you sure you want to activate "${s.name}"? It will immediately become available for customer bookings.`,
        confirmText: 'Activate Service',
        variant: 'success',
        icon: 'power',
        onConfirm: () => handleToggleServiceActive(s.id, false),
      });
    }
  };

  const requestCancelBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    const customerName = b ? customerMap[b.userId]?.name || 'the customer' : 'the customer';
    const serviceName = b ? serviceMap[b.serviceId] || 'appointment' : 'appointment';
    const dateStr = b?.bookingDate ? format(parseISO(b.bookingDate), 'MMM d') : '';
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Appointment?',
      description: `Are you sure you want to cancel the ${serviceName} appointment for ${customerName}${dateStr ? ` on ${dateStr}` : ''}?`,
      confirmText: 'Cancel Appointment',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => handleBookingAction(bookingId, 'cancel'),
    });
  };

  // --- Settings ---
  const [savingSettings, setSavingSettings] = useState(false);
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      showToast('Settings saved');
      fetchAll(false);
    } else {
      showToast('Failed to save settings', 'error');
    }
    setSavingSettings(false);
  };

  // --- Filtered & Paginated data ---
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CONFIRMED') {
          if (b.status !== 'ACCEPTED' && b.status !== 'CONFIRMED' && b.status !== 'PENDING') return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }
      if (bookingSearch) {
        const q = bookingSearch.toLowerCase();
        const customer = customerMap[b.userId];
        const serviceName = serviceMap[b.serviceId] || '';
        if (
          !(customer?.name?.toLowerCase().includes(q)) &&
          !(customer?.email?.toLowerCase().includes(q)) &&
          !(serviceName.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, bookingSearch, customerMap, serviceMap]);

  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * bookingPageSize;
    return filteredBookings.slice(start, start + bookingPageSize);
  }, [filteredBookings, bookingPage, bookingPageSize]);

  const bookingTotalPages = Math.max(1, Math.ceil(filteredBookings.length / bookingPageSize));

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Exclude admin accounts from customer list
      if (c.role === 'ADMIN') return false;
      if (!customerSearch) return true;
      const q = customerSearch.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    });
  }, [customers, customerSearch]);

  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  const customerTotalPages = Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize));

  // Reset page index when search or status filters change
  useEffect(() => {
    setBookingPage(1);
  }, [statusFilter, bookingSearch]);

  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch]);

  const exportBookingsToCSV = () => {
    if (filteredBookings.length === 0) return showToast('No bookings to export', 'error');
    const headers = ['Booking ID', 'Date', 'Start Time', 'End Time', 'Customer Name', 'Customer Email', 'Service', 'Status', 'Created At'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.bookingDate,
      b.startTime,
      b.endTime || '',
      `"${(customerMap[b.userId]?.name || 'Unknown').replace(/"/g, '""')}"`,
      customerMap[b.userId]?.email || '',
      `"${(serviceMap[b.serviceId] || 'Unknown').replace(/"/g, '""')}"`,
      b.status,
      b.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aurelian_bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Bookings exported to CSV');
  };

  // --- Analytics ---
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = subDays(new Date(), 7);
  const todayBookingsCount = bookings.filter(b => b.bookingDate === today && (b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING')).length;
  const activeUpcomingBookings = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING');
  const completedThisWeek = bookings.filter(b => b.status === 'COMPLETED' && isAfter(parseISO(b.createdAt), weekAgo)).length;
  const totalCustomers = customers.filter(c => c.role !== 'ADMIN').length;

  // Week range string
  const weekStartStr = format(weekAgo, 'MMM d');
  const weekEndStr = format(new Date(), 'MMM d');

  // Sparkline paths (decorative)
  const sparkline1 = "M0,30 Q10,25 20,30 T40,20 T60,35 T80,10 T100,20";
  const sparkline2 = "M0,35 Q15,35 30,20 T60,30 T85,15 T100,5";
  const sparkline3 = "M0,25 Q20,30 35,25 T60,15 T80,25 T100,10";
  const sparkline4 = "M0,15 Q20,25 40,30 T70,35 T100,30";
  const bigSparkline = "M0,35 Q15,30 30,25 T50,30 T65,10 T80,30 T100,20";

  // ========================
  // Render
  // ========================
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Responsive Confirmation Box */}
      <ConfirmationModal config={confirmModal} onClose={() => setConfirmModal(null)} />

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        
        {/* ======================== DESKTOP SIDEBAR ======================== */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:flex flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] h-full transition-colors"
        >
          <div className="p-8">
            <h4 className="font-sans text-[10px] uppercase tracking-[0.4em] text-[var(--color-primary)] mb-2 font-bold">Management</h4>
            <h1 className="text-3xl font-light text-[var(--color-primary-text)] italic tracking-tight font-serif">Admin</h1>
          </div>

          <div 
            role="tablist" 
            aria-label="Admin dashboard tabs" 
            className="flex-1 flex flex-col gap-2 px-4"
          >
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  ref={el => { tabsRef.current[idx] = el; }}
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`relative flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-xs uppercase tracking-widest transition-all duration-300 overflow-hidden outline-none cursor-pointer ${
                    isActive
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold shadow-sm'
                      : 'text-[var(--color-secondary-text)] font-semibold hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActiveIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_10px_rgba(229,195,120,0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ======================== MAIN CONTENT AREA ======================== */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[var(--color-bg)] transition-colors">
          <div className="p-3.5 sm:p-8 md:p-12 pb-24 sm:pb-12 min-h-full flex flex-col">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center justify-center h-64 text-[var(--color-primary)] font-sans text-xs uppercase tracking-widest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="tabpanel"
                  id={`panel-${activeTab}`}
                  aria-labelledby={`tab-${activeTab}`}
                  className="space-y-6 sm:space-y-8 flex-1 flex flex-col"
                >

                  {/* ======================== OVERVIEW TAB ======================== */}
                  {activeTab === 'overview' && (
                    <>
                      <motion.div variants={itemVariants} className="mb-2 sm:mb-8">
                        <h1 className="text-xl sm:text-4xl md:text-5xl font-light text-[var(--color-primary-text)] mb-1.5 sm:mb-4 tracking-tight">
                          Good day, <span className="text-[var(--color-primary)] italic font-serif">Admin.</span>
                        </h1>
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-sans text-[9px] sm:text-[11px] tracking-wider sm:tracking-widest shadow-sm font-bold">
                          <span className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center font-bold">
                            <ChevronRight size={10} className="sm:w-3 sm:h-3" />
                          </span>
                          <span>This Week ({weekStartStr} - {weekEndStr})</span>
                        </div>
                      </motion.div>

                      <motion.div variants={listVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                        <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarDays size={16} />} pathData={sparkline1} />
                        <StatCard label="Today's Bookings" value={todayBookingsCount} icon={<Clock size={16} />} accent={todayBookingsCount > 0} pathData={sparkline2} />
                        <StatCard label="Total Customers" value={totalCustomers} icon={<Users size={16} />} pathData={sparkline3} />
                        <StatCard label="Completed Week" value={completedThisWeek} icon={<Scissors size={16} />} pathData={sparkline4} />
                      </motion.div>

                      {/* Large Trend Chart */}
                      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] p-3 sm:p-8 shadow-sm sm:shadow-md h-40 sm:h-64 group transition-colors">
                        <BorderBeam size={180} duration={14} colorFrom="var(--color-primary)" borderWidth={1} />
                        <div className="flex items-center justify-between z-10 relative">
                          <div className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest flex items-center gap-1.5 font-bold">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--color-primary)]" />
                            Weekly Booking Trends
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-48 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                            <defs>
                              <linearGradient id="grad-big" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <motion.path 
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                              d={`${bigSparkline} L100,40 L0,40 Z`} 
                              fill="url(#grad-big)" 
                            />
                            <motion.path 
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                              d={bigSparkline} 
                              fill="none" 
                              stroke="var(--color-primary)" 
                              strokeWidth="1.5" 
                              className="drop-shadow-[0_0_10px_rgba(229,195,120,0.8)]" 
                            />
                          </svg>
                        </div>
                      </motion.div>

                      {/* ======================== UPCOMING APPOINTMENTS ANIMATED LIST ======================== */}
                      <motion.div variants={itemVariants} className="mt-4 sm:mt-8 space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)] font-semibold flex items-center gap-2">
                            <Clock size={12} className="text-[var(--color-primary)]" />
                            <span>Upcoming Appointments</span>
                          </h2>
                          <span className="text-[10px] text-[var(--color-secondary-text)] font-sans font-semibold">
                            {activeUpcomingBookings.length} Scheduled
                          </span>
                        </div>

                        {activeUpcomingBookings.length === 0 ? (
                          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mx-auto flex items-center justify-center">
                              <CalendarDays size={18} />
                            </div>
                            <h3 className="font-serif text-sm sm:text-base font-medium text-[var(--color-primary-text)]">
                              No upcoming appointments
                            </h3>
                            <p className="font-sans text-xs text-[var(--color-secondary-text)] max-w-xs mx-auto">
                              New customer bookings will automatically appear here in real-time.
                            </p>
                          </div>
                        ) : (
                          <>
                            <AnimatedList delay={400}>
                              {activeUpcomingBookings.slice(0, 5).map((b) => {
                                const customer = customerMap[b.userId];
                                return (
                                  <div
                                    key={b.id}
                                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                        <Scissors size={18} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[var(--color-primary-text)] font-semibold text-xs sm:text-sm truncate">
                                            {customer?.name || 'Unknown'}
                                          </span>
                                          <span className="text-[var(--color-secondary-text)] text-xs">·</span>
                                          <span className="text-[10px] text-[var(--color-primary)] font-medium">
                                            {serviceMap[b.serviceId] || 'Service'}
                                          </span>
                                        </div>
                                        <div className="font-sans text-[10px] text-[var(--color-secondary-text)] flex items-center gap-1.5 pt-0.5">
                                          <span>{format(parseISO(b.bookingDate), 'MMM d, yyyy')}</span>
                                          <span>•</span>
                                          <span className="font-medium text-[var(--color-primary-text)]">{b.startTime}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <StatusBadge status={b.status} />
                                      <button
                                        onClick={() => handleBookingAction(b.id, 'complete')}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-sans text-[9px] uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-sm font-bold cursor-pointer"
                                      >
                                        Complete
                                      </button>
                                      <button
                                        onClick={() => requestCancelBooking(b.id)}
                                        className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] font-sans text-[9px] uppercase tracking-wider hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </AnimatedList>

                            {activeUpcomingBookings.length > 5 && (
                              <button
                                onClick={() => { setActiveTab('bookings'); setStatusFilter('CONFIRMED'); }}
                                className="w-full py-2.5 sm:py-3 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-primary)] font-sans text-[10px] sm:text-[11px] uppercase tracking-wider hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer shadow-sm font-semibold text-center"
                              >
                                View all {activeUpcomingBookings.length} upcoming bookings →
                              </button>
                            )}
                          </>
                        )}
                      </motion.div>
                    </>
                  )}

                  {/* ======================== BOOKINGS TAB ======================== */}
                  {activeTab === 'bookings' && (
                    <div className="flex-1 flex flex-col">
                      <motion.div variants={itemVariants} className="flex flex-col gap-2.5 lg:flex-row lg:items-center justify-between mb-3 sm:mb-6 shrink-0">
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          {/* Mobile Status Filter Dropdown */}
                          <div className="sm:hidden relative flex-1">
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value as any)}
                              aria-label="Filter bookings by status"
                              className="w-full appearance-none px-3.5 py-2 pr-8 rounded-xl bg-[var(--color-card-bg)] text-[var(--color-primary-text)] font-sans text-xs uppercase tracking-wider font-semibold focus:outline-none cursor-pointer shadow-sm"
                            >
                              {STATUS_FILTERS.map(sf => {
                                const count = sf === 'ALL'
                                  ? bookings.length
                                  : sf === 'CONFIRMED'
                                    ? bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING').length
                                    : bookings.filter(b => b.status === sf).length;
                                return (
                                  <option key={sf} value={sf} className="bg-[var(--color-surface-raised)] text-[var(--color-primary-text)]">
                                    Status: {sf} ({count})
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none" />
                          </div>

                          {/* Desktop Status Filter Pills */}
                          <div className="hidden sm:flex flex-wrap gap-1 bg-[var(--color-card-bg)] p-1 rounded-xl shadow-sm" role="group" aria-label="Filter bookings by status">
                            {STATUS_FILTERS.map(sf => {
                              const countForFilter = sf === 'ALL'
                                ? bookings.length
                                : sf === 'CONFIRMED'
                                  ? bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING').length
                                  : bookings.filter(b => b.status === sf).length;
                              return (
                                <button
                                  key={sf}
                                  onClick={() => setStatusFilter(sf)}
                                  aria-pressed={statusFilter === sf}
                                  className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] uppercase tracking-wider font-sans font-semibold transition-all focus:outline-none flex items-center gap-1 cursor-pointer ${
                                    statusFilter === sf
                                      ? 'bg-[var(--color-primary)] text-black shadow-sm font-bold'
                                      : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)]'
                                  }`}
                                >
                                  <span>{sf}</span>
                                  <span className={`text-[8px] sm:text-[9px] px-1 rounded-full ${statusFilter === sf ? 'bg-black/20 text-black' : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)]'}`}>
                                    {countForFilter}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={exportBookingsToCSV}
                            className="px-3 sm:px-4 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                            title="Export filtered bookings to CSV"
                          >
                            <Download size={13} className="text-[var(--color-primary)]" />
                            <span>Export CSV</span>
                          </button>
                        </div>

                        <div className="relative w-full lg:w-80">
                          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
                          <input
                            type="search"
                            placeholder="Search customer, service..."
                            value={bookingSearch}
                            onChange={e => setBookingSearch(e.target.value)}
                            aria-label="Search bookings by customer or service"
                            className="w-full pl-9 pr-3.5 py-2 rounded-lg sm:rounded-xl bg-[var(--color-card-bg)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:outline-none font-sans text-xs tracking-wider transition-all"
                          />
                          {bookingSearch && (
                            <button
                              onClick={() => setBookingSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] p-1 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>

                      {/* Mobile View: Direct Animated List (No outer box container) */}
                      <div className="sm:hidden flex-1 flex flex-col gap-3">
                        {filteredBookings.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-center text-[var(--color-secondary-text)] font-sans text-xs uppercase tracking-wider">
                            {bookingSearch || statusFilter !== 'ALL' ? 'No bookings match your filters' : 'No bookings found'}
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto">
                            <AnimatedList delay={80}>
                              {paginatedBookings.map((b) => {
                                const customer = customerMap[b.userId];
                                const isActive = b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING';
                                return (
                                  <div
                                    key={b.id}
                                    className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                                          <CalendarDays size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-[var(--color-primary-text)] font-semibold text-sm truncate block">
                                            {customer?.name || 'Unknown'}
                                          </span>
                                          <span className="text-xs text-[var(--color-secondary-text)] truncate block font-sans">
                                            {customer?.email || ''}
                                          </span>
                                        </div>
                                      </div>
                                      <StatusBadge status={b.status} />
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border)]">
                                      <span className="font-medium text-[var(--color-primary-text)]">
                                        {serviceMap[b.serviceId] || 'Service'}
                                      </span>
                                      <span className="text-[var(--color-secondary-text)] font-sans text-[11px]">
                                        {format(parseISO(b.bookingDate), 'MMM d, yyyy')} • {b.startTime}
                                      </span>
                                    </div>

                                    {isActive && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          onClick={() => handleBookingAction(b.id, 'complete')}
                                          className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer shadow-sm"
                                        >
                                          Complete
                                        </button>
                                        <button
                                          onClick={() => requestCancelBooking(b.id)}
                                          className="flex-1 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-red-400 text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </AnimatedList>
                          </div>
                        )}
                        <div className="pt-1">
                          <DataPagination
                            currentPage={bookingPage}
                            totalPages={bookingTotalPages}
                            totalItems={filteredBookings.length}
                            pageSize={bookingPageSize}
                            onPageChange={setBookingPage}
                            onPageSizeChange={setBookingPageSize}
                            pageSizeOptions={[5, 10, 20, 50]}
                          />
                        </div>
                      </div>

                      {/* Desktop View: Table Container */}
                      <motion.div variants={itemVariants} className="hidden sm:flex flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-xl min-h-[350px] transition-colors">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[800px]" aria-label="Bookings table">
                            <thead className="border-b border-[var(--color-surface-raised)] bg-[var(--color-surface-raised)] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Date & Time</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Customer</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Service</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Status</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-surface-raised)]">
                              {filteredBookings.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-8 py-24 text-center text-[var(--color-secondary-text)] font-sans text-[11px] uppercase tracking-widest">
                                    {bookingSearch || statusFilter !== 'ALL' ? 'No bookings match your filters' : 'No bookings found'}
                                  </td>
                                </tr>
                              ) : paginatedBookings.map((b, i) => {
                                const customer = customerMap[b.userId];
                                const isActive = b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING';
                                return (
                                  <motion.tr 
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    key={b.id} 
                                    className="hover:bg-[var(--color-surface-raised)]/60 transition-colors group"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="text-[var(--color-primary-text)] tracking-wider mb-0.5 text-xs font-semibold">{format(parseISO(b.bookingDate), 'MMM d, yyyy')}</div>
                                      <div className="text-[11px] text-[var(--color-secondary-text)] tracking-widest uppercase">{b.startTime} – {b.endTime}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-[var(--color-primary)] font-semibold text-sm mb-0.5">{customer?.name || 'Unknown'}</div>
                                      <div className="text-[11px] text-[var(--color-secondary-text)]">{customer?.email || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 font-normal text-[var(--color-body-text)] text-xs">{serviceMap[b.serviceId] || 'Unknown'}</td>
                                    <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isActive && (
                                          <>
                                            <button onClick={() => handleBookingAction(b.id, 'complete')} className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-[10px] uppercase tracking-widest transition-all font-semibold cursor-pointer">Complete</button>
                                            <button onClick={() => requestCancelBooking(b.id)} className="px-3.5 py-1.5 rounded-lg text-[var(--color-secondary-text)] hover:bg-red-500/10 hover:text-red-500 text-[10px] uppercase tracking-widest transition-all cursor-pointer">Cancel</button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination Footer */}
                        <DataPagination
                          currentPage={bookingPage}
                          totalPages={bookingTotalPages}
                          totalItems={filteredBookings.length}
                          pageSize={bookingPageSize}
                          onPageChange={setBookingPage}
                          onPageSizeChange={setBookingPageSize}
                          pageSizeOptions={[5, 10, 20, 50]}
                        />
                      </motion.div>
                    </div>
                  )}

                  {/* ======================== CUSTOMERS TAB ======================== */}
                  {activeTab === 'customers' && (
                    <div className="flex-1 flex flex-col">
                      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-6 shrink-0">
                        <div className="font-sans text-[11px] sm:text-xs uppercase tracking-wider text-[var(--color-secondary-text)] flex items-center gap-2" aria-live="polite">
                          <Users size={14} className="text-[var(--color-primary)]" />
                          <span>
                            <strong className="text-[var(--color-primary-text)] text-sm sm:text-lg font-medium mr-1.5">{filteredCustomers.length}</strong>
                            Registered Customer{filteredCustomers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="relative w-full sm:w-80">
                          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
                          <input
                            type="search"
                            placeholder="Search by name or email..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 rounded-lg sm:rounded-xl bg-[var(--color-card-bg)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:outline-none font-sans text-xs tracking-wider transition-all"
                          />
                          {customerSearch && (
                            <button
                              onClick={() => setCustomerSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] p-1 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>

                      {/* Mobile View: Direct Animated List (No outer box container) */}
                      <div className="sm:hidden flex-1 flex flex-col gap-3">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-center text-[var(--color-secondary-text)] font-sans text-xs uppercase tracking-wider">
                            {customerSearch ? 'No customers match search' : 'No registered customers found'}
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto">
                            <AnimatedList delay={80}>
                              {paginatedCustomers.map((c) => (
                                <div
                                  key={c.id}
                                  className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all"
                                >
                                  {editingCustomerId === c.id ? (
                                    <div className="space-y-2.5">
                                      <input
                                        type="text"
                                        value={editCustomerName}
                                        onChange={e => setEditCustomerName(e.target.value)}
                                        placeholder="Customer Name"
                                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] text-xs outline-none"
                                        autoFocus
                                      />
                                      <input
                                        type="email"
                                        value={editCustomerEmail}
                                        onChange={e => setEditCustomerEmail(e.target.value)}
                                        placeholder="Customer Email"
                                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] text-xs outline-none"
                                      />
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => handleSaveCustomerEdit(c.id)}
                                          className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer shadow-sm"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingCustomerId(null)}
                                          className="flex-1 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-serif font-bold text-sm shrink-0 border border-[var(--color-primary)]/20">
                                            {(c.name || 'U').charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-[var(--color-primary-text)] font-semibold text-sm truncate">{c.name}</div>
                                            <div className="text-[var(--color-secondary-text)] text-xs truncate font-sans">{c.email}</div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border)] text-[var(--color-secondary-text)] font-sans">
                                        <span>Bookings: <strong className="text-[var(--color-primary-text)] font-semibold">{c.bookingCount}</strong></span>
                                        <span>Joined: {c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                                      </div>

                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          onClick={() => {
                                            setEditingCustomerId(c.id);
                                            setEditCustomerName(c.name || '');
                                            setEditCustomerEmail(c.email || '');
                                          }}
                                          className="flex-1 py-2 rounded-xl bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer text-center"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => requestToggleRole(c)}
                                          className="flex-1 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary-text)] text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer text-center"
                                        >
                                          Promote
                                        </button>
                                        <button
                                          onClick={() => requestDeleteCustomer(c)}
                                          className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer text-center"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </AnimatedList>
                          </div>
                        )}
                        <div className="pt-1">
                          <DataPagination
                            currentPage={customerPage}
                            totalPages={customerTotalPages}
                            totalItems={filteredCustomers.length}
                            pageSize={customerPageSize}
                            onPageChange={setCustomerPage}
                            onPageSizeChange={setCustomerPageSize}
                            pageSizeOptions={[5, 10, 20, 50]}
                          />
                        </div>
                      </div>

                      {/* Desktop View: Table Container */}
                      <motion.div variants={itemVariants} className="hidden sm:flex flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-xl min-h-[350px] transition-colors">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[700px]">
                            <thead className="border-b border-[var(--color-surface-raised)] bg-[var(--color-surface-raised)] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Customer</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Role</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold text-center">Bookings</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold text-right">Joined</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-surface-raised)]">
                              {filteredCustomers.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-8 py-24 text-center text-[var(--color-secondary-text)] font-sans text-[11px] uppercase tracking-widest">
                                    {customerSearch ? 'No customers match your search' : 'No registered customers found'}
                                  </td>
                                </tr>
                              ) : paginatedCustomers.map((c, i) => (
                                <motion.tr 
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  key={c.id} 
                                  className="hover:bg-[var(--color-surface-raised)]/60 transition-colors group"
                                >
                                  <td className="px-6 py-4">
                                    {editingCustomerId === c.id ? (
                                      <div className="space-y-2 max-w-xs">
                                        <input
                                          type="text"
                                          value={editCustomerName}
                                          onChange={e => setEditCustomerName(e.target.value)}
                                          placeholder="Customer Name"
                                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--color-card-bg)] text-[var(--color-primary-text)] text-xs outline-none shadow-sm"
                                          autoFocus
                                        />
                                        <input
                                          type="email"
                                          value={editCustomerEmail}
                                          onChange={e => setEditCustomerEmail(e.target.value)}
                                          placeholder="Customer Email"
                                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--color-card-bg)] text-[var(--color-secondary-text)] text-xs outline-none"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-[var(--color-primary-text)] font-semibold text-sm mb-0.5">{c.name}</div>
                                        <div className="text-[var(--color-secondary-text)] text-xs font-sans">{c.email}</div>
                                      </>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-sans font-semibold text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                                      {c.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-[var(--color-primary-text)] font-semibold text-sm">{c.bookingCount}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-[var(--color-secondary-text)] text-xs font-sans">
                                    {c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      {editingCustomerId === c.id ? (
                                        <>
                                          <button
                                            onClick={() => handleSaveCustomerEdit(c.id)}
                                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all font-semibold shadow-sm cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingCustomerId(null)}
                                            className="px-3.5 py-1.5 rounded-lg text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-primary-text)] text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingCustomerId(c.id);
                                              setEditCustomerName(c.name || '');
                                              setEditCustomerEmail(c.email || '');
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[10px] uppercase tracking-widest transition-all font-semibold cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => requestToggleRole(c)}
                                            className="px-3 py-1.5 rounded-lg text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-primary-text)] text-[10px] uppercase tracking-widest transition-all cursor-pointer font-semibold"
                                          >
                                            Promote
                                          </button>
                                          <button
                                            onClick={() => requestDeleteCustomer(c)}
                                            className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 text-[10px] uppercase tracking-widest transition-all cursor-pointer font-semibold"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination Footer */}
                        <DataPagination
                          currentPage={customerPage}
                          totalPages={customerTotalPages}
                          totalItems={filteredCustomers.length}
                          pageSize={customerPageSize}
                          onPageChange={setCustomerPage}
                          onPageSizeChange={setCustomerPageSize}
                          pageSizeOptions={[5, 10, 20, 50]}
                        />
                      </motion.div>
                    </div>
                  )}

                  {/* ======================== SERVICES TAB ======================== */}
                  {activeTab === 'services' && (
                    <div className="flex-1 flex flex-col">
                      <motion.form variants={itemVariants} onSubmit={handleAddService} className="shrink-0 p-3.5 sm:p-8 rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-md sm:shadow-xl space-y-3 sm:space-y-6 mb-3 sm:mb-8 transition-colors">
                        <h3 className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2 font-semibold">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <Scissors size={12} className="sm:w-3.5 sm:h-3.5" />
                          </div>
                          Add New Service
                        </h3>
                        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-6">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={newServiceName}
                              onChange={e => setNewServiceName(e.target.value)}
                              placeholder="Service Name (e.g. Haircut)"
                              required
                              className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                            />
                          </div>
                          <div className="w-full md:w-48">
                            <div className="relative">
                              <input
                                type="number"
                                min={5}
                                max={480}
                                step={5}
                                value={newServiceDuration}
                                onChange={e => setNewServiceDuration(parseInt(e.target.value) || 30)}
                                required
                                className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                                Mins
                              </span>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md font-bold cursor-pointer"
                          >
                            Add Service
                          </motion.button>
                        </div>
                      </motion.form>

                      {/* Mobile View: Direct Animated List (No outer box container) */}
                      <div className="sm:hidden flex-1 overflow-y-auto">
                        <AnimatedList delay={80}>
                          {allServices.map((s) => (
                            <div
                              key={s.id}
                              className={`p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all ${!s.active ? 'opacity-40 grayscale' : ''}`}
                            >
                              {editingServiceId === s.id ? (
                                <div className="space-y-2.5">
                                  <input
                                    value={editServiceName}
                                    onChange={e => setEditServiceName(e.target.value)}
                                    placeholder="Service Name"
                                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] text-xs outline-none"
                                    autoFocus
                                  />
                                  <input
                                    type="number"
                                    min={5}
                                    value={editServiceDuration}
                                    onChange={e => setEditServiceDuration(parseInt(e.target.value) || 30)}
                                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] text-xs outline-none"
                                  />
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => handleSaveServiceEdit(s.id)}
                                      className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold cursor-pointer shadow-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingServiceId(null)}
                                      className="flex-1 py-2 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                                      <Scissors size={18} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[var(--color-primary-text)] font-semibold text-sm truncate">{s.name}</div>
                                      <div className="text-[var(--color-secondary-text)] text-xs font-sans">
                                        {s.durationMinutes} <span className="text-[10px]">MIN</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Switch
                                      checked={s.active}
                                      onCheckedChange={() => requestToggleServiceActive(s)}
                                      aria-label={`Toggle ${s.name} active`}
                                    />
                                    <button
                                      onClick={() => {
                                        setEditingServiceId(s.id);
                                        setEditServiceName(s.name);
                                        setEditServiceDuration(s.durationMinutes);
                                      }}
                                      className="px-3 py-1.5 rounded-xl text-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[10px] uppercase tracking-wider font-semibold cursor-pointer hover:bg-[var(--color-primary)]/20 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </AnimatedList>
                      </div>

                      {/* Desktop View: Table Container */}
                      <motion.div variants={itemVariants} className="hidden sm:flex flex-1 flex-col overflow-hidden rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-xl min-h-[350px] transition-colors">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[600px]">
                            <thead className="border-b border-[var(--color-surface-raised)] bg-[var(--color-surface-raised)] sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-8 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Service</th>
                              <th scope="col" className="px-8 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Duration</th>
                              <th scope="col" className="px-8 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold">Status</th>
                              <th scope="col" className="px-8 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-secondary-text)] font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-surface-raised)]">
                            {allServices.map((s, i) => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={s.id} 
                                className={`hover:bg-[var(--color-surface-raised)]/60 transition-colors group ${!s.active ? 'opacity-40 grayscale' : ''}`}
                              >
                                <td className="px-8 py-4">
                                  {editingServiceId === s.id ? (
                                    <input value={editServiceName} onChange={e => setEditServiceName(e.target.value)} className="px-4 py-2 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-primary)] text-[var(--color-primary-text)] outline-none font-sans text-sm w-full transition-shadow" autoFocus />
                                  ) : <span className="text-[var(--color-primary-text)] font-semibold text-[15px]">{s.name}</span>}
                                </td>
                                <td className="px-8 py-4">
                                  {editingServiceId === s.id ? (
                                    <input type="number" min={5} value={editServiceDuration} onChange={e => setEditServiceDuration(parseInt(e.target.value) || 30)} className="w-24 px-4 py-2 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-primary)] text-[var(--color-primary-text)] outline-none font-sans text-sm transition-shadow" />
                                  ) : <span className="text-[var(--color-primary-text)]">{s.durationMinutes} <span className="text-[var(--color-secondary-text)] text-xs ml-1 font-semibold">MIN</span></span>}
                                </td>
                                <td className="px-8 py-4">
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={s.active}
                                      onCheckedChange={() => requestToggleServiceActive(s)}
                                      aria-label={`Toggle ${s.name} active`}
                                    />
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-sans font-semibold border ${s.active ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-[var(--color-muted-text)] border-[var(--color-border)] bg-[var(--color-surface-raised)]'}`}>
                                      {s.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingServiceId === s.id ? (
                                      <>
                                        <button onClick={() => handleSaveServiceEdit(s.id)} className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all font-semibold shadow-sm cursor-pointer">Save</button>
                                        <button onClick={() => setEditingServiceId(null)} className="px-3.5 py-1.5 rounded-lg text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-primary-text)] text-[10px] uppercase tracking-widest transition-all cursor-pointer">Cancel</button>
                                      </>
                                    ) : (
                                      <button onClick={() => { setEditingServiceId(s.id); setEditServiceName(s.name); setEditServiceDuration(s.durationMinutes); }} className="px-3.5 py-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[10px] uppercase tracking-widest transition-all font-semibold cursor-pointer">Edit</button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                        <div className="shrink-0 p-3 sm:p-4 border-t border-[var(--color-surface-raised)] bg-[var(--color-surface-raised)] text-center text-[9px] uppercase tracking-wider text-[var(--color-muted-text)] font-semibold">
                          End of Services
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ======================== SETTINGS TAB ======================== */}
                  {activeTab === 'settings' && (
                    <motion.div variants={itemVariants}>
                      <form onSubmit={handleSettingsSubmit} className="space-y-4 sm:space-y-8 max-w-2xl p-3.5 sm:p-12 rounded-xl sm:rounded-3xl bg-[var(--color-card-bg)] shadow-md sm:shadow-xl transition-colors">
                        <div className="border-b border-[var(--color-surface-raised)] pb-3 sm:pb-6 mb-3 sm:mb-8">
                          <h2 className="text-lg sm:text-3xl font-light text-[var(--color-primary-text)] flex items-center gap-2 sm:gap-4 font-serif">
                            <SettingsIcon className="text-[var(--color-primary)]" size={20}/> Shop Configuration
                          </h2>
                          <p className="text-[var(--color-secondary-text)] font-sans text-[11px] sm:text-xs mt-1 sm:mt-3">Manage your salon's operating hours and booking rules.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8">
                          <div className="space-y-1 sm:space-y-2">
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-primary)] ml-1 font-semibold">Opening Time</label>
                            <input type="time" value={settings.openingTime || ''} onChange={e => setSettings({ ...settings, openingTime: e.target.value })} className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all" required />
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-primary)] ml-1 font-semibold">Closing Time</label>
                            <input type="time" value={settings.closingTime || ''} onChange={e => setSettings({ ...settings, closingTime: e.target.value })} className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all" required />
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-primary)] ml-1 font-semibold">Slot Duration <span className="text-[var(--color-secondary-text)] lowercase tracking-normal">(minutes)</span></label>
                            <input type="number" value={settings.slotDurationMinutes || ''} onChange={e => setSettings({ ...settings, slotDurationMinutes: parseInt(e.target.value) })} className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all" required />
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-primary)] ml-1 font-semibold">Min Advance <span className="text-[var(--color-secondary-text)] lowercase tracking-normal">(minutes)</span></label>
                            <input type="number" value={settings.minimumAdvanceMinutes || ''} onChange={e => setSettings({ ...settings, minimumAdvanceMinutes: parseInt(e.target.value) })} className="w-full px-3.5 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm transition-all" required />
                          </div>
                        </div>
                        
                        <div className="pt-2 sm:pt-6">
                          <motion.button 
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            className="w-full py-2.5 sm:py-4 rounded-lg sm:rounded-xl bg-[var(--color-primary)] text-black font-sans text-[10px] sm:text-[11px] uppercase tracking-wider font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-sm cursor-pointer"
                          >
                            Save Settings
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  {/* ======================== PROFILE TAB ======================== */}
                  {activeTab === 'profile' && (
                    <motion.div variants={itemVariants} className="space-y-3 sm:space-y-6">
                      
                      {/* Top Banner (Avatar & Basic Info) */}
                      <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-3xl p-3.5 sm:p-10 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-8 shadow-md sm:shadow-xl transition-colors">
                        <div className="relative group shrink-0 z-10">
                          <div className="w-14 h-14 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary)]/20 flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center overflow-hidden relative">
                              {newImage || adminUser?.image ? (
                                <img src={newImage || adminUser?.image} alt={adminUser?.name || 'Admin'} className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} className="text-[var(--color-secondary-text)] sm:w-12 sm:h-12" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left z-10 min-w-0">
                          <h1 className="text-xl sm:text-4xl font-serif text-[var(--color-primary-text)] mb-0.5 sm:mb-2 font-medium truncate">{adminUser?.name || 'Admin'}</h1>
                          <p className="text-[var(--color-secondary-text)] font-sans text-[10px] sm:text-[11px] uppercase tracking-wider mb-2 sm:mb-4 truncate">{adminUser?.email || 'admin@example.com'}</p>
                          
                          <div className="inline-flex px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold">
                            Administrator
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                        
                        {/* Left Column: Account Details */}
                        <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-3xl p-3.5 sm:p-10 flex flex-col shadow-md sm:shadow-lg transition-colors">
                          <div className="flex items-center gap-2 mb-3 sm:mb-8 pb-2.5 sm:pb-4 border-b border-[var(--color-surface-raised)]">
                            <User size={14} className="text-[var(--color-primary)] sm:w-4 sm:h-4" />
                            <h2 className="text-[var(--color-primary)] font-sans text-[10px] uppercase tracking-wider font-semibold">Account Details</h2>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-6 flex-1">
                            <div>
                              <label className="block font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Full Name</label>
                              <input 
                                type="text" 
                                value={isEditingProfile ? newName : adminUser?.name || ''}
                                onChange={e => setNewName(e.target.value)}
                                disabled={!isEditingProfile}
                                className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm disabled:opacity-70"
                              />
                            </div>
                            
                            <div>
                              <label className="block font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Email Address</label>
                              <input 
                                type="email" 
                                value={adminUser?.email || ''}
                                disabled
                                className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3.5 text-[var(--color-secondary-text)] focus:outline-none font-sans text-xs sm:text-sm disabled:opacity-50"
                              />
                            </div>

                            <AnimatePresence>
                              {isEditingProfile && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <label className="block font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 mt-3 font-semibold">Avatar URL (Optional)</label>
                                  <input 
                                    type="url" 
                                    value={newImage}
                                    onChange={e => setNewImage(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="mt-4 sm:mt-8 pt-3 sm:pt-8 border-t border-[var(--color-surface-raised)] flex gap-2">
                            <button 
                              onClick={handleUpdateProfile}
                              disabled={updatingProfile}
                              className={`px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-sans text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 font-bold cursor-pointer ${
                                isEditingProfile 
                                  ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] shadow-sm' 
                                  : 'bg-[var(--color-surface-raised)] text-[var(--color-primary-text)]'
                              }`}
                            >
                              {updatingProfile ? 'Saving...' : isEditingProfile ? 'Save Profile' : 'Edit Profile'}
                            </button>
                            
                            {isEditingProfile && (
                              <button 
                                onClick={() => {
                                  setIsEditingProfile(false);
                                  setNewName(adminUser?.name || '');
                                  setNewImage(adminUser?.image || '');
                                }}
                                className="px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-2xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Security */}
                        <div className="space-y-3 sm:space-y-6 flex flex-col">
                          <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-3xl p-3.5 sm:p-10 flex-1 shadow-md sm:shadow-lg transition-colors">
                            <div className="flex items-center gap-2 mb-3 sm:mb-8 pb-2.5 sm:pb-4 border-b border-[var(--color-surface-raised)]">
                              <Shield size={14} className="text-[var(--color-primary)] sm:w-4 sm:h-4" />
                              <h2 className="text-[var(--color-primary)] font-sans text-[10px] uppercase tracking-wider font-semibold">Security</h2>
                            </div>

                            {checkingPassword ? (
                              <div className="text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider flex h-full items-center justify-center">Checking status...</div>
                            ) : (
                              <div className="space-y-3 sm:space-y-6">
                                {!hasPassword && (
                                  <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 sm:px-5 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-sans text-[10px] uppercase tracking-wider flex items-center gap-2 mb-3 font-medium">
                                    <AlertCircle size={14} /> No password set for this account.
                                  </div>
                                )}
                                
                                {hasPassword && (
                                  <div>
                                    <label className="block font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Current Password</label>
                                    <input 
                                      type="password" 
                                      value={currentPassword}
                                      onChange={e => setCurrentPassword(e.target.value)}
                                      placeholder="••••••••"
                                      className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="block font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">New Password</label>
                                  <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--color-surface-raised)] rounded-lg sm:rounded-2xl px-3.5 sm:px-5 py-2 sm:py-3.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs sm:text-sm"
                                  />
                                </div>

                                <div className="pt-2 sm:pt-6">
                                  <button 
                                    onClick={handleChangePassword}
                                    disabled={updatingPassword}
                                    className="px-4 sm:px-8 py-2 sm:py-3 bg-[var(--color-primary)] text-black font-sans text-[10px] uppercase tracking-wider rounded-lg sm:rounded-2xl hover:bg-[var(--color-primary-hover)] transition-all shadow-sm font-bold cursor-pointer disabled:opacity-70"
                                  >
                                    {updatingPassword ? (hasPassword ? 'Updating...' : 'Setting...') : (hasPassword ? 'Update Password' : 'Set Password')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-3xl p-3.5 sm:p-8 flex items-center justify-between gap-3 shadow-md sm:shadow-lg transition-colors">
                            <div className="flex items-center gap-2.5 sm:gap-5">
                              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center shrink-0">
                                <Shield size={16} className="text-[var(--color-primary)]" />
                              </div>
                              <div>
                                <h3 className="text-[var(--color-primary-text)] font-serif text-sm sm:text-lg mb-0.5 font-medium">Two-Factor Authentication</h3>
                                <p className="text-[var(--color-secondary-text)] font-sans text-[9px] sm:text-[10px]">Add an extra layer of security</p>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => showToast('2FA setup sent to email')}
                              className="w-11 h-6 rounded-full transition-colors relative bg-[var(--color-surface-raised)] cursor-pointer"
                            >
                              <div className="w-4 h-4 rounded-full bg-[var(--color-primary-text)] absolute top-1 transition-all left-1" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

      {/* ======================== MOBILE BOTTOM NAVIGATION ======================== */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-sidebar-bg)] border-t border-[var(--color-border)] pb-safe pt-1 px-2 shadow-2xl transition-colors">
        <div role="tablist" className="flex justify-around items-center h-14">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none cursor-pointer ${
                  isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? '-translate-y-0.5 scale-105' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[8px] uppercase tracking-wider font-sans font-medium transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.label}
                </span>
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute bottom-0 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

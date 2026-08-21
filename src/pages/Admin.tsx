import React, { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, CalendarDays, Users, Scissors, Settings as SettingsIcon, ChevronRight, ChevronDown, Clock, User, Shield, Lock, AlertCircle, AlertTriangle, Trash2, Power, Camera, Download, Search, RefreshCw, X, Check, Plus, DollarSign, Sparkles, Edit2, Store, Phone, Mail, MapPin, Coffee, Sliders, Megaphone, ArrowLeft } from 'lucide-react';
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
import { Skeleton, StatCardSkeleton } from '../components/ui/skeleton';

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
  price?: number;
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

// --- Status Badge Component (Memoized) ---
const StatusBadge = React.memo(function StatusBadge({ status }: { status: string }) {
  const displayLabel = status === 'ACCEPTED' ? 'CONFIRMED' : status;
  const colors: Record<string, string> = {
    CONFIRMED: 'text-emerald-500 bg-emerald-500/15 font-bold',
    PENDING: 'text-[var(--color-primary)] bg-[var(--color-primary)]/15 font-bold',
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
});

// --- Stat Card with SVG Sparkline & Magic UI (Memoized) ---
const StatCard = React.memo(function StatCard({ label, value, icon, accent = false, pathData }: { label: string; value: number | string; icon?: React.ReactNode, accent?: boolean, pathData: string }) {
  const numValue = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(229,195,120,0.12)' }}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-3 sm:p-4 flex flex-col justify-between h-20 sm:h-24 transition-all group shadow-sm hover:shadow-md"
    >
      {accent && <BorderBeam size={60} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />}
      <div className="flex items-center gap-2 z-10">
        <div className="text-[var(--color-primary)] scale-90 sm:scale-100">{icon}</div>
        <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[var(--color-secondary-text)] truncate">{label}</span>
      </div>
      <div className={`text-lg sm:text-2xl font-bold z-10 font-sans tracking-tight ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary-text)]'}`}>
        <NumberTicker value={numValue} />
      </div>
      
      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 opacity-25 group-hover:opacity-75 transition-opacity duration-500">
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
});

// --- Toast Notification ---
function Toast({ message, type = 'success', onDone }: { message: string; type?: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border ${
        type === 'error'
          ? 'bg-red-950/30 border-red-500/30 text-red-500'
          : 'bg-[var(--color-surface-raised)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
      } font-sans text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 font-semibold`}
      role="alert"
      aria-live="polite"
    >
      <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`} />
      <span>{message}</span>
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

  // Service Modal & Form State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>(50);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(30);
  const [isCreatingService, setIsCreatingService] = useState(false);

  // Service Setup / Edit Modal State
  const [selectedServiceForSetup, setSelectedServiceForSetup] = useState<Service | null>(null);
  const [setupServiceName, setSetupServiceName] = useState('');
  const [setupServicePrice, setSetupServicePrice] = useState<number | ''>(50);
  const [setupServiceDuration, setSetupServiceDuration] = useState<number>(30);
  const [setupServiceActive, setSetupServiceActive] = useState<boolean>(true);
  const [isSavingSetup, setIsSavingSetup] = useState(false);

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
  const handleTabKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;

    e.preventDefault();
    tabsRef.current[next]?.focus();
    setActiveTab(TABS[next].key);
  }, []);

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

  // --- Customer map for booking display (Memoized) ---
  const customerMap = useMemo(() => {
    const map: Record<string, Customer> = {};
    customers.forEach(c => { map[c.id] = c; });
    return map;
  }, [customers]);

  // --- Booking actions ---
  const handleBookingAction = useCallback(async (id: string, action: string) => {
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
  }, [fetchAll, showToast]);

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
  const handleAddService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newServiceName.trim();
    if (!trimmedName) return showToast('Please enter a service name', 'error');

    const duration = Number(newServiceDuration) || 30;
    const price = newServicePrice === '' ? 0 : Number(newServicePrice);

    setIsCreatingService(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: trimmedName, 
          durationMinutes: duration,
          price: price >= 0 ? price : 0
        }),
      });
      if (res.ok) {
        setNewServiceName('');
        setNewServiceDuration(30);
        setNewServicePrice(50);
        setIsAddServiceOpen(false);
        fetchAll(false);
        showToast('Service created successfully');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to create service', 'error');
      }
    } catch {
      showToast('Failed to create service', 'error');
    } finally {
      setIsCreatingService(false);
    }
  };

  const openServiceSetup = (s: Service) => {
    setSelectedServiceForSetup(s);
    setSetupServiceName(s.name);
    setSetupServiceDuration(s.durationMinutes);
    setSetupServicePrice(s.price !== undefined && s.price !== null ? s.price : (s.name.toLowerCase().includes('shav') ? 50 : s.name.toLowerCase().includes('zat') ? 90 : 75));
    setSetupServiceActive(s.active);
  };

  const handleSaveServiceSetup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedServiceForSetup) return;
    const trimmedName = setupServiceName.trim();
    if (!trimmedName) return showToast('Service name cannot be empty', 'error');
    const duration = Number(setupServiceDuration) || 30;
    const price = setupServicePrice === '' ? 0 : Number(setupServicePrice);
    const active = setupServiceActive;

    setIsSavingSetup(true);
    // Optimistic UI update
    setAllServices(prev => prev.map(s => s.id === selectedServiceForSetup.id ? {
      ...s,
      name: trimmedName,
      durationMinutes: duration,
      price,
      active
    } : s));
    setServiceMap(prev => ({ ...prev, [selectedServiceForSetup.id]: trimmedName }));
    const currentId = selectedServiceForSetup.id;
    setSelectedServiceForSetup(null);
    showToast('Service setup updated');

    try {
      const res = await fetch(`/api/admin/services/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          durationMinutes: duration,
          price,
          active
        }),
      });
      if (res.ok) {
        fetchAll(false);
      } else {
        fetchAll(false);
        showToast('Failed to update service setup', 'error');
      }
    } catch {
      showToast('Network error updating service', 'error');
    } finally {
      setIsSavingSetup(false);
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

  const requestDeleteService = (s: Service) => {
    if (selectedServiceForSetup?.id === s.id) {
      setSelectedServiceForSetup(null);
    }
    setConfirmModal({
      isOpen: true,
      title: `Delete "${s.name}"?`,
      description: `Are you sure you want to permanently delete "${s.name}"? This service will be immediately removed from the catalog and booking system.`,
      confirmText: 'Delete Service',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => handleDeleteService(s.id),
    });
  };

  const handleDeleteService = async (id: string) => {
    // Optimistic update
    setAllServices(prev => prev.filter(s => s.id !== id));
    setServiceMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast('Service deleted successfully');

    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchAll(false);
    } else {
      fetchAll(false);
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'Failed to delete service', 'error');
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
  const handleSettingsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      showToast('Shop configuration saved successfully');
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

  // --- Analytics (Memoized) ---
  const { todayBookingsCount, activeUpcomingBookings, completedThisWeek, totalCustomers, weekStartStr, weekEndStr } = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekAgo = subDays(new Date(), 7);
    const todayCount = bookings.filter(b => b.bookingDate === today && (b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING')).length;
    const activeBookings = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'CONFIRMED' || b.status === 'PENDING');
    const completed = bookings.filter(b => b.status === 'COMPLETED' && isAfter(parseISO(b.createdAt), weekAgo)).length;
    const totalCust = customers.filter(c => c.role !== 'ADMIN').length;

    return {
      todayBookingsCount: todayCount,
      activeUpcomingBookings: activeBookings,
      completedThisWeek: completed,
      totalCustomers: totalCust,
      weekStartStr: format(weekAgo, 'MMM d'),
      weekEndStr: format(new Date(), 'MMM d'),
    };
  }, [bookings, customers]);

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

      {/* Add New Service Modal Dialog */}
      <Dialog open={isAddServiceOpen} onOpenChange={(open) => { if (!open) setIsAddServiceOpen(false); }}>
        <DialogContent onClose={() => setIsAddServiceOpen(false)} className="max-w-[94vw] sm:max-w-lg p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[var(--color-card-bg)] shadow-2xl border border-[var(--color-border)]">
          <form onSubmit={handleAddService} className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border)]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                <Scissors size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-medium text-[var(--color-primary-text)]">
                  Add New Service
                </h2>
                <p className="font-sans text-[11px] sm:text-xs text-[var(--color-secondary-text)]">
                  Configure service name, pricing, and appointment duration
                </p>
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-1.5">
              <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                placeholder="e.g. Haircut & Beard Trim"
                required
                autoFocus
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
              />
            </div>

            {/* Charges (Price) & Duration (Time) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Charges */}
              <div className="space-y-1.5">
                <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                  Charges / Price ({settings.currencySymbol || '$'}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)] font-bold text-sm">{settings.currencySymbol || '$'}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newServicePrice}
                    onChange={e => setNewServicePrice(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    placeholder="50"
                    required
                    className="w-full pl-8 pr-4 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                  Duration (Time) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={newServiceDuration}
                    onChange={e => setNewServiceDuration(parseInt(e.target.value) || 30)}
                    required
                    className="w-full pl-4 pr-14 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                    Mins
                  </span>
                </div>
              </div>
            </div>

            {/* Duration Quick Presets */}
            <div className="space-y-1.5 pt-0.5">
              <span className="font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold">
                Quick Duration Presets:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[15, 20, 30, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setNewServiceDuration(mins)}
                    className={`px-2.5 py-1 rounded-lg font-sans text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      newServiceDuration === mins
                        ? 'bg-[var(--color-primary)] text-black shadow-sm font-bold'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--color-surface-raised)]/70 border border-[var(--color-border)] space-y-1">
              <span className="font-sans text-[9px] uppercase tracking-wider text-[var(--color-muted-text)] font-semibold">Preview</span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Scissors size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-primary-text)] truncate">
                      {newServiceName.trim() || 'Service Name Preview'}
                    </div>
                    <div className="text-[10px] text-[var(--color-secondary-text)] font-sans">
                      {newServiceDuration || 30} mins duration
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold font-sans text-[var(--color-primary)] shrink-0">
                  ${newServicePrice === '' ? 0 : newServicePrice}
                </div>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] font-sans text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingService}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
              >
                {isCreatingService ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} className="stroke-[2.5] shrink-0" />
                    <span>Add Service</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Setup & Edit Menu Modal Dialog */}
      <Dialog open={!!selectedServiceForSetup} onOpenChange={(open) => { if (!open) setSelectedServiceForSetup(null); }}>
        <DialogContent onClose={() => setSelectedServiceForSetup(null)} className="max-w-[94vw] sm:max-w-lg p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[var(--color-card-bg)] shadow-2xl border border-[var(--color-border)]">
          {selectedServiceForSetup && (
            <form onSubmit={handleSaveServiceSetup} className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                    <Scissors size={20} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-[var(--color-primary-text)]">
                      Service Setup
                    </h2>
                    <p className="font-sans text-[11px] sm:text-xs text-[var(--color-secondary-text)]">
                      Configure service details, duration, pricing & availability
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={setupServiceName}
                  onChange={e => setSetupServiceName(e.target.value)}
                  placeholder="e.g. Precision Haircut"
                  required
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                />
              </div>

              {/* Charges (Price) & Duration (Time) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Charges */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                    Charges / Price ({settings.currencySymbol || '$'}) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)] font-bold text-sm">{settings.currencySymbol || '$'}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={setupServicePrice}
                      onChange={e => setSetupServicePrice(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      placeholder="50"
                      required
                      className="w-full pl-8 pr-4 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="block font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">
                    Duration (Time) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      value={setupServiceDuration}
                      onChange={e => setSetupServiceDuration(parseInt(e.target.value) || 30)}
                      required
                      className="w-full pl-4 pr-14 py-2.5 sm:py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs sm:text-sm transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                      Mins
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration Quick Presets */}
              <div className="space-y-1.5 pt-0.5">
                <span className="font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold">
                  Quick Duration Presets:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {[15, 20, 30, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSetupServiceDuration(mins)}
                      className={`px-2.5 py-1 rounded-lg font-sans text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                        setupServiceDuration === mins
                          ? 'bg-[var(--color-primary)] text-black shadow-sm font-bold'
                          : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Status Toggle Card */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-primary-text)] font-sans">
                      Active Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-semibold border ${
                      setupServiceActive
                        ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                        : 'text-[var(--color-muted-text)] border-[var(--color-border)] bg-[var(--color-card-bg)]'
                    }`}>
                      {setupServiceActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-secondary-text)] font-sans mt-0.5">
                    {setupServiceActive ? 'Available for customer bookings online' : 'Hidden from customer booking options'}
                  </p>
                </div>
                <Switch
                  checked={setupServiceActive}
                  onCheckedChange={setSetupServiceActive}
                  aria-label="Toggle active status in setup"
                />
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5 pt-3 border-t border-[var(--color-border)]">
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => requestDeleteService(selectedServiceForSetup)}
                  className="w-full sm:w-auto px-3.5 py-2 sm:py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 font-sans text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <Trash2 size={13} className="shrink-0" />
                  <span>Delete Service</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceForSetup(null)}
                    className="flex-1 sm:flex-none px-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] font-sans text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer text-center whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSetup}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 text-center whitespace-nowrap"
                  >
                    {isSavingSetup ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[2.5] shrink-0" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Button (+) for Services (Mobile Only - Hidden on PC) */}
      {activeTab === 'services' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsAddServiceOpen(true)}
          className="sm:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center p-3.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans font-bold shadow-[0_8px_25px_rgba(229,195,120,0.35)] transition-all cursor-pointer group"
          aria-label="Add new service"
          title="Add New Service"
        >
          <Plus size={22} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
        </motion.button>
      )}

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        
        {/* ======================== DESKTOP SIDEBAR ======================== */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:flex flex-col w-60 lg:w-64 border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] h-full transition-colors shrink-0"
        >
          <div className="h-16 sm:h-20 flex items-center justify-between px-5 border-b border-[var(--color-border)] shrink-0">
            <div>
              <h4 className="font-sans text-[8.5px] uppercase tracking-[0.3em] text-[var(--color-primary)] font-bold">Control Center</h4>
              <h1 className="text-base sm:text-lg font-serif text-[var(--color-primary-text)] font-medium">Aurelian Admin</h1>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[8.5px] uppercase tracking-wider font-semibold border border-[var(--color-primary)]/20">
              Admin
            </span>
          </div>

          <div 
            role="tablist" 
            aria-label="Admin dashboard tabs" 
            className="flex-1 flex flex-col gap-1.5 p-3.5 sm:p-4 overflow-y-auto"
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
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-sans text-xs uppercase tracking-wider transition-all duration-200 overflow-hidden outline-none cursor-pointer ${
                    isActive
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold shadow-sm border-l-[3px] border-[var(--color-primary)]'
                      : 'text-[var(--color-secondary-text)] font-medium hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] border-l-[3px] border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ======================== MAIN CONTENT AREA ======================== */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[var(--color-bg)] transition-colors">
          <div className="p-3.5 sm:p-6 lg:p-8 pb-20 sm:pb-8 min-h-full flex flex-col max-w-7xl mx-auto w-full">
            {loading ? (
              <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col animate-in fade-in duration-300">
                {/* Header Skeleton */}
                <div className="mb-1.5 sm:mb-3 space-y-2">
                  <Skeleton className="w-56 h-7 rounded-md" />
                  <Skeleton className="w-40 h-5 rounded-full" />
                </div>

                {/* 4 Stat Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </div>

                {/* Trends Chart Skeleton */}
                <Skeleton className="w-full h-28 sm:h-36 rounded-xl sm:rounded-2xl" />

                {/* Quick Actions & Recent Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Skeleton className="h-44 rounded-xl sm:rounded-2xl" />
                  <Skeleton className="h-44 rounded-xl sm:rounded-2xl" />
                </div>
              </div>
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
                      <motion.div variants={itemVariants} className="mb-1.5 sm:mb-3">
                        <h1 className="text-lg sm:text-2xl font-light text-[var(--color-primary-text)] mb-1 sm:mb-2 tracking-tight">
                          Good day, <span className="text-[var(--color-primary)] italic font-serif">Admin.</span>
                        </h1>
                        <div className="inline-flex items-center gap-1.5 text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full font-sans text-[9px] sm:text-[10px] tracking-wider shadow-sm font-bold">
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center font-bold">
                            <ChevronRight size={10} />
                          </span>
                          <span>This Week ({weekStartStr} - {weekEndStr})</span>
                        </div>
                      </motion.div>

                      <motion.div variants={listVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                        <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarDays size={15} />} pathData={sparkline1} />
                        <StatCard label="Today's Bookings" value={todayBookingsCount} icon={<Clock size={15} />} accent={todayBookingsCount > 0} pathData={sparkline2} />
                        <StatCard label="Total Customers" value={totalCustomers} icon={<Users size={15} />} pathData={sparkline3} />
                        <StatCard label="Completed Week" value={completedThisWeek} icon={<Scissors size={15} />} pathData={sparkline4} />
                      </motion.div>

                      {/* Large Trend Chart */}
                      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-3 sm:p-4 shadow-sm h-28 sm:h-36 group transition-colors">
                        <BorderBeam size={120} duration={14} colorFrom="var(--color-primary)" borderWidth={1} />
                        <div className="flex items-center justify-between z-10 relative">
                          <div className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                            Weekly Booking Trends
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
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
                      <motion.div variants={itemVariants} className="mt-3 sm:mt-4 space-y-2.5">
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
                          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mx-auto flex items-center justify-center">
                              <CalendarDays size={15} />
                            </div>
                            <h3 className="font-serif text-xs sm:text-sm font-medium text-[var(--color-primary-text)]">
                              No upcoming appointments
                            </h3>
                            <p className="font-sans text-[11px] text-[var(--color-secondary-text)] max-w-xs mx-auto">
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

                      {/* Direct Animated List (Mobile & PC - No outer box container) */}
                      <div className="flex-1 flex flex-col gap-3">
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
                                    className="p-4 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 rounded-2xl shadow-sm hover:shadow-md transition-all"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                                      {/* Customer & Status */}
                                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                                          <CalendarDays size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[var(--color-primary-text)] font-semibold text-sm sm:text-base truncate block">
                                              {customer?.name || 'Unknown'}
                                            </span>
                                            <StatusBadge status={b.status} />
                                          </div>
                                          <span className="text-xs text-[var(--color-secondary-text)] truncate block font-sans mt-0.5">
                                            {customer?.email || ''}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Service & Time */}
                                      <div className="flex items-center gap-4 text-xs font-sans sm:px-4 sm:border-x sm:border-[var(--color-border)] shrink-0">
                                        <div>
                                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] block font-semibold">Service</span>
                                          <span className="font-medium text-[var(--color-primary-text)] text-xs sm:text-sm">{serviceMap[b.serviceId] || 'Service'}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] block font-semibold">Scheduled</span>
                                          <span className="text-[var(--color-secondary-text)] text-xs">{format(parseISO(b.bookingDate), 'MMM d, yyyy')} • {b.startTime}</span>
                                        </div>
                                      </div>

                                      {/* Action Buttons with Icons */}
                                      {isActive ? (
                                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                                          <button
                                            onClick={() => handleBookingAction(b.id, 'complete')}
                                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                                            title="Mark completed"
                                          >
                                            <Check size={13} className="stroke-[2.5]" />
                                            <span>Complete</span>
                                          </button>
                                          <button
                                            onClick={() => requestCancelBooking(b.id)}
                                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-red-500/10 text-[var(--color-secondary-text)] hover:text-red-400 text-[11px] sm:text-xs uppercase tracking-wider font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                                            title="Cancel booking"
                                          >
                                            <X size={13} className="stroke-[2.5]" />
                                            <span>Cancel</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="hidden sm:block text-xs text-[var(--color-muted-text)] italic font-sans shrink-0">
                                          Archived
                                        </div>
                                      )}
                                    </div>
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

                      {/* Direct Animated List (Mobile & PC - No outer box container) */}
                      <div className="flex-1 flex flex-col gap-3">
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
                                  className="p-4 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 rounded-2xl shadow-sm hover:shadow-md transition-all"
                                >
                                  {editingCustomerId === c.id ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                          type="text"
                                          value={editCustomerName}
                                          onChange={e => setEditCustomerName(e.target.value)}
                                          placeholder="Customer Name"
                                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                          autoFocus
                                        />
                                        <input
                                          type="email"
                                          value={editCustomerEmail}
                                          onChange={e => setEditCustomerEmail(e.target.value)}
                                          placeholder="Customer Email"
                                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                        />
                                      </div>
                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          onClick={() => setEditingCustomerId(null)}
                                          className="px-4 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] text-xs uppercase tracking-wider font-semibold cursor-pointer transition-all"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleSaveCustomerEdit(c.id)}
                                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs uppercase tracking-wider font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                          <Check size={14} className="stroke-[2.5]" />
                                          <span>Save</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                                      {/* Customer Info (Avatar, Name, Email, Role) */}
                                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-serif font-bold text-sm sm:text-base shrink-0 border border-[var(--color-primary)]/20">
                                          {(c.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[var(--color-primary-text)] font-semibold text-sm sm:text-base truncate">{c.name}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-sans font-semibold text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] shrink-0">
                                              {c.role}
                                            </span>
                                          </div>
                                          <div className="text-[var(--color-secondary-text)] text-xs truncate font-sans mt-0.5">{c.email}</div>
                                        </div>
                                      </div>

                                      {/* Stats (Bookings & Joined) */}
                                      <div className="flex items-center gap-4 text-xs text-[var(--color-secondary-text)] font-sans sm:px-4 sm:border-x sm:border-[var(--color-border)] shrink-0">
                                        <div>
                                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] block font-semibold">Bookings</span>
                                          <strong className="text-[var(--color-primary-text)] font-semibold text-xs sm:text-sm">{c.bookingCount}</strong>
                                        </div>
                                        <div>
                                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] block font-semibold">Joined</span>
                                          <span className="text-[var(--color-secondary-text)] text-xs">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                                        </div>
                                      </div>

                                      {/* Action Buttons with Icons */}
                                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                                        <button
                                          onClick={() => {
                                            setEditingCustomerId(c.id);
                                            setEditCustomerName(c.name || '');
                                            setEditCustomerEmail(c.email || '');
                                          }}
                                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                          title="Edit customer"
                                        >
                                          <Edit2 size={13} className="stroke-[2.2]" />
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          onClick={() => requestDeleteCustomer(c)}
                                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                          title="Delete customer"
                                        >
                                          <Trash2 size={13} className="stroke-[2.2]" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>
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
                    </div>
                  )}

                  {/* ======================== SERVICES TAB ======================== */}
                  {activeTab === 'services' && (
                    <div className="flex-1 flex flex-col">
                      {/* Services Header & Quick Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 shrink-0">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="font-serif text-lg sm:text-2xl font-light text-[var(--color-primary-text)] tracking-tight">
                              Services <span className="text-[var(--color-primary)] italic">Catalog</span>
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                              {allServices.length} Total
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-secondary-text)] font-sans mt-0.5">
                            Manage salon services, pricing, and appointment durations
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsAddServiceOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                          >
                            <Plus size={16} className="stroke-[2.5]" />
                            Add Service
                          </motion.button>
                        </div>
                      </div>

                      {/* Services Catalog - Responsive Grid on PC */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                          {allServices.map((s, idx) => (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              whileHover={{ y: -2 }}
                              onClick={() => openServiceSetup(s)}
                              className={`p-4 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group select-none ${!s.active ? 'opacity-40 grayscale-[30%]' : ''}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20 group-hover:scale-105 transition-transform">
                                    <Scissors size={20} className="sm:w-5 sm:h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[var(--color-primary-text)] font-semibold text-sm sm:text-base truncate group-hover:text-[var(--color-primary)] transition-colors">{s.name}</span>
                                      {!s.active && (
                                        <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-semibold text-[var(--color-muted-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                                          Inactive
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[var(--color-secondary-text)] text-xs font-sans flex items-center gap-2 mt-0.5">
                                      <span>{s.durationMinutes} <span className="text-[10px] font-semibold">MIN</span></span>
                                      <span>•</span>
                                      <span className="text-[var(--color-primary)] font-semibold font-sans">{(settings.currencySymbol || '$')}{s.price !== undefined && s.price !== null ? s.price : (s.name.toLowerCase().includes('shav') ? 50 : 75)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-[var(--color-muted-text)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all">
                                  <ChevronRight size={18} />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================== SETTINGS TAB ======================== */}
                  {activeTab === 'settings' && (
                    <motion.div variants={itemVariants} className="space-y-6 max-w-5xl">
                      {/* Settings Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="font-serif text-lg sm:text-2xl font-light text-[var(--color-primary-text)] tracking-tight">
                              Shop <span className="text-[var(--color-primary)] italic">Configuration</span>
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                              Salon Control Center
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-secondary-text)] font-sans mt-0.5">
                            Customize salon branding, operating hours, booking rules, breaks, and broadcast notices
                          </p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleSettingsSubmit()}
                          disabled={savingSettings}
                          className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          <Check size={16} className="stroke-[2.5]" />
                          <span>{savingSettings ? 'Saving...' : 'Save All Changes'}</span>
                        </motion.button>
                      </div>

                      {/* Section 1: Salon Branding & Contact Info */}
                      <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[var(--color-border)] shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--color-border)]">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                            <Store size={16} />
                          </div>
                          <div>
                            <h3 className="font-serif text-sm sm:text-base font-medium text-[var(--color-primary-text)]">Salon Branding & Contact Details</h3>
                            <p className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans">Business identity displayed on customer receipts, booking screens, and communications</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Salon / Shop Name</label>
                            <input
                              type="text"
                              value={settings.shopName || ''}
                              onChange={e => setSettings({ ...settings, shopName: e.target.value })}
                              placeholder="e.g. Aurelian Salon"
                              className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Tagline / Slogan</label>
                            <input
                              type="text"
                              value={settings.shopTagline || ''}
                              onChange={e => setSettings({ ...settings, shopTagline: e.target.value })}
                              placeholder="e.g. Mastering The Craft of Timeless Elegance"
                              className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Contact Phone / WhatsApp</label>
                            <div className="relative">
                              <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
                              <input
                                type="text"
                                value={settings.phone || ''}
                                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                placeholder="e.g. +1 (555) 234-5678"
                                className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Customer Support Email</label>
                            <div className="relative">
                              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
                              <input
                                type="email"
                                value={settings.email || ''}
                                onChange={e => setSettings({ ...settings, email: e.target.value })}
                                placeholder="e.g. contact@aureliansalon.com"
                                className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Physical Salon Address</label>
                            <div className="relative">
                              <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
                              <input
                                type="text"
                                value={settings.address || ''}
                                onChange={e => setSettings({ ...settings, address: e.target.value })}
                                placeholder="e.g. 123 Luxury Ave, Beverly Hills, CA 90210"
                                className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Operating Schedule, Working Days & Breaks */}
                      <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[var(--color-border)] shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--color-border)]">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                            <Clock size={16} />
                          </div>
                          <div>
                            <h3 className="font-serif text-sm sm:text-base font-medium text-[var(--color-primary-text)]">Operating Hours & Weekly Schedule</h3>
                            <p className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans">Set daily open/close hours, weekly off-days, and lunch break intervals</p>
                          </div>
                        </div>

                        {/* Daily Open / Close */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1.5">Opening Time</label>
                            <input
                              type="time"
                              value={settings.openingTime || '09:00'}
                              onChange={e => setSettings({ ...settings, openingTime: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1.5">Closing Time</label>
                            <input
                              type="time"
                              value={settings.closingTime || '19:00'}
                              onChange={e => setSettings({ ...settings, closingTime: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                        </div>

                        {/* Weekly Working Days Selection */}
                        <div>
                          <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-2">Weekly Working Days (Click to toggle Off-Days)</label>
                          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {[
                              { label: 'Sun', day: 0 },
                              { label: 'Mon', day: 1 },
                              { label: 'Tue', day: 2 },
                              { label: 'Wed', day: 3 },
                              { label: 'Thu', day: 4 },
                              { label: 'Fri', day: 5 },
                              { label: 'Sat', day: 6 },
                            ].map(({ label, day }) => {
                              const closedList = (settings.closedDays || '').split(',').map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
                              const isClosed = closedList.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    let newList = [...closedList];
                                    if (isClosed) {
                                      newList = newList.filter(d => d !== day);
                                    } else {
                                      newList.push(day);
                                    }
                                    setSettings({ ...settings, closedDays: newList.join(',') });
                                  }}
                                  className={`py-2 px-1 rounded-xl text-center font-sans text-xs font-semibold border transition-all cursor-pointer ${
                                    isClosed
                                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  }`}
                                >
                                  <div className="text-[11px] sm:text-xs font-bold">{label}</div>
                                  <div className="text-[9px] uppercase tracking-wider mt-0.5">{isClosed ? 'Closed' : 'Open'}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Lunch / Daily Break */}
                        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coffee size={16} className="text-[var(--color-primary)]" />
                              <div>
                                <span className="font-sans text-xs font-semibold text-[var(--color-primary-text)]">Daily Lunch / Staff Break</span>
                                <p className="text-[10px] text-[var(--color-secondary-text)] font-sans">Slots during this window are automatically excluded from customer bookings</p>
                              </div>
                            </div>
                            <Switch
                              checked={!!settings.breakEnabled}
                              onCheckedChange={checked => setSettings({ ...settings, breakEnabled: checked })}
                            />
                          </div>

                          {settings.breakEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)]">
                              <div>
                                <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] font-semibold mb-1">Break Start</label>
                                <input
                                  type="time"
                                  value={settings.breakStartTime || '13:00'}
                                  onChange={e => setSettings({ ...settings, breakStartTime: e.target.value })}
                                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-primary-text)] text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] font-semibold mb-1">Break End</label>
                                <input
                                  type="time"
                                  value={settings.breakEndTime || '14:00'}
                                  onChange={e => setSettings({ ...settings, breakEndTime: e.target.value })}
                                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-primary-text)] text-xs outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Booking Rules & Policies */}
                      <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[var(--color-border)] shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--color-border)]">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                            <Sliders size={16} />
                          </div>
                          <div>
                            <h3 className="font-serif text-sm sm:text-base font-medium text-[var(--color-primary-text)]">Booking Rules & Cancellation Policies</h3>
                            <p className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans">Control appointment intervals, advance booking windows, auto-confirm mode, and cancellations</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1.5">Slot Interval (Mins)</label>
                            <select
                              value={settings.slotDurationMinutes !== undefined ? settings.slotDurationMinutes : 30}
                              onChange={e => setSettings({ ...settings, slotDurationMinutes: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            >
                              <option value={15}>15 Minutes</option>
                              <option value={20}>20 Minutes</option>
                              <option value={30}>30 Minutes</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1.5">Min Advance Notice (Mins)</label>
                            <input
                              type="number"
                              min={0}
                              value={settings.minimumAdvanceMinutes !== undefined ? settings.minimumAdvanceMinutes : 60}
                              onChange={e => setSettings({ ...settings, minimumAdvanceMinutes: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                          <div>
                            <label className="block font-sans text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-1.5">Max Booking Window (Days)</label>
                            <input
                              type="number"
                              min={0}
                              value={settings.maximumAdvanceDays !== undefined ? settings.maximumAdvanceDays : 30}
                              onChange={e => setSettings({ ...settings, maximumAdvanceDays: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
                          {/* Auto-Confirm Toggle */}
                          <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between">
                            <div>
                              <span className="font-sans text-xs font-semibold text-[var(--color-primary-text)] block">Auto-Confirm Appointments</span>
                              <span className="text-[10px] text-[var(--color-secondary-text)] font-sans">Automatically accept bookings without requiring manual admin approval</span>
                            </div>
                            <Switch
                              checked={settings.autoConfirmBookings !== false}
                              onCheckedChange={checked => setSettings({ ...settings, autoConfirmBookings: checked })}
                            />
                          </div>

                          {/* Cancellation Policy */}
                          <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-sans text-xs font-semibold text-[var(--color-primary-text)] block">Allow Client Cancellation</span>
                                <span className="text-[10px] text-[var(--color-secondary-text)] font-sans">Allow clients to cancel from their dashboard</span>
                              </div>
                              <Switch
                                checked={settings.allowCancellation !== false}
                                onCheckedChange={checked => setSettings({ ...settings, allowCancellation: checked })}
                              />
                            </div>
                            {settings.allowCancellation !== false && (
                              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[10px] text-[var(--color-primary-text)] uppercase tracking-wider font-semibold">
                                    Cutoff Prior To Booking
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={
                                        settings.cancellationCutoffMinutes !== undefined
                                          ? settings.cancellationCutoffMinutes
                                          : settings.cancellationCutoffHours !== undefined
                                          ? settings.cancellationCutoffHours * 60
                                          : 120
                                      }
                                      onChange={e => {
                                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                        setSettings({
                                          ...settings,
                                          cancellationCutoffMinutes: val,
                                          cancellationCutoffHours: typeof val === 'number' ? Math.floor(val / 60) : 0
                                        });
                                      }}
                                      className="w-20 px-2 py-1 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-primary-text)] text-xs text-right font-bold"
                                    />
                                    <span className="text-[10px] text-[var(--color-secondary-text)] font-sans">mins</span>
                                  </div>
                                </div>

                                {/* Quick Presets for Cancellation: 0m (Anytime), 5m, 15m, 30m, 1h, 2h */}
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {[
                                    { label: '0m (Anytime)', value: 0 },
                                    { label: '5m', value: 5 },
                                    { label: '15m', value: 15 },
                                    { label: '30m', value: 30 },
                                    { label: '1h', value: 60 },
                                    { label: '2h', value: 120 },
                                  ].map(preset => {
                                    const currentCutoff =
                                      settings.cancellationCutoffMinutes !== undefined
                                        ? settings.cancellationCutoffMinutes
                                        : settings.cancellationCutoffHours !== undefined
                                        ? settings.cancellationCutoffHours * 60
                                        : 120;
                                    const isSelected = currentCutoff === preset.value;
                                    return (
                                      <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() =>
                                          setSettings({
                                            ...settings,
                                            cancellationCutoffMinutes: preset.value,
                                            cancellationCutoffHours: Math.floor(preset.value / 60)
                                          })
                                        }
                                        className={`px-2 py-0.5 rounded-md font-sans text-[9px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                                            : 'bg-[var(--color-surface)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]'
                                        }`}
                                      >
                                        {preset.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Currency & Broadcast Announcement */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {/* Currency Symbol */}
                        <div className="bg-[var(--color-card-bg)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <DollarSign size={16} className="text-[var(--color-primary)]" />
                            <h3 className="font-serif text-sm font-medium text-[var(--color-primary-text)]">Pricing Currency</h3>
                          </div>
                          <p className="text-[10px] text-[var(--color-secondary-text)] font-sans">Currency symbol used across services and customer checkout</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {[
                              { symbol: '$', label: '$ USD' },
                              { symbol: '€', label: '€ EUR' },
                              { symbol: '£', label: '£ GBP' },
                              { symbol: '₹', label: '₹ INR' },
                              { symbol: 'AED', label: 'AED' },
                            ].map(curr => (
                              <button
                                key={curr.symbol}
                                type="button"
                                onClick={() => setSettings({ ...settings, currencySymbol: curr.symbol })}
                                className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl font-bold font-sans text-xs border transition-all cursor-pointer text-center ${
                                  (settings.currencySymbol || '$') === curr.symbol
                                    ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-sm'
                                    : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] border-[var(--color-border)] hover:text-[var(--color-primary-text)]'
                                }`}
                              >
                                {curr.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Broadcast Announcement Banner */}
                        <div className="sm:col-span-2 bg-[var(--color-card-bg)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                            <div className="flex items-center gap-2">
                              <Megaphone size={16} className="text-[var(--color-primary)]" />
                              <h3 className="font-serif text-sm font-medium text-[var(--color-primary-text)]">Shop Notice / Announcement Banner</h3>
                            </div>
                            <Switch
                              checked={!!settings.announcementActive}
                              onCheckedChange={checked => setSettings({ ...settings, announcementActive: checked })}
                            />
                          </div>
                          <input
                            type="text"
                            value={settings.announcementText || ''}
                            onChange={e => setSettings({ ...settings, announcementText: e.target.value })}
                            placeholder="e.g. Special Holiday Promo: 20% off all beard grooming this weekend!"
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-primary-text)] focus:border-[var(--color-primary)] focus:outline-none font-sans text-xs transition-all"
                          />
                          <p className="text-[10px] text-[var(--color-secondary-text)] font-sans">When enabled, this broadcast banner appears prominently at the top of the client booking page.</p>
                        </div>
                      </div>

                      {/* Bottom Save Action */}
                      <div className="pt-2 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleSettingsSubmit()}
                          disabled={savingSettings}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Check size={16} className="stroke-[2.5]" />
                          <span>{savingSettings ? 'Saving...' : 'Save All Changes'}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  {/* ======================== PROFILE TAB ======================== */}
                  {activeTab === 'profile' && (
                    <motion.div variants={itemVariants} className="space-y-3 sm:space-y-5">
                      
                      {/* Top Banner (Avatar & Basic Info) */}
                      <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 shadow-sm transition-colors">
                        <div className="relative group shrink-0 z-10">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary)]/20 flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center overflow-hidden relative">
                              {newImage || adminUser?.image ? (
                                <img src={newImage || adminUser?.image} alt={adminUser?.name || 'Admin'} className="w-full h-full object-cover" />
                              ) : (
                                <User size={20} className="text-[var(--color-secondary-text)] sm:w-8 sm:h-8" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left z-10 min-w-0">
                          <h1 className="text-base sm:text-xl font-serif text-[var(--color-primary-text)] mb-0.5 font-medium truncate">{adminUser?.name || 'Admin'}</h1>
                          <p className="text-[var(--color-secondary-text)] font-sans text-[10px] sm:text-[11px] uppercase tracking-wider mb-1.5 truncate">{adminUser?.email || 'admin@example.com'}</p>
                          
                          <div className="inline-flex px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-sans text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold">
                            Administrator
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
                        
                        {/* Left Column: Account Details */}
                        <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col shadow-sm transition-colors">
                          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[var(--color-border)]">
                            <User size={14} className="text-[var(--color-primary)]" />
                            <h2 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Account Details</h2>
                          </div>
                          
                          <div className="space-y-3 flex-1">
                            <div>
                              <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Full Name</label>
                              <input 
                                type="text" 
                                value={isEditingProfile ? newName : adminUser?.name || ''}
                                onChange={e => setNewName(e.target.value)}
                                disabled={!isEditingProfile}
                                className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs disabled:opacity-70"
                              />
                            </div>
                            
                            <div>
                              <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Email Address</label>
                              <input 
                                type="email" 
                                value={adminUser?.email || ''}
                                disabled
                                className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[var(--color-secondary-text)] focus:outline-none font-sans text-xs disabled:opacity-50"
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
                        <div className="space-y-3 sm:space-y-5 flex flex-col">
                          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex-1 shadow-sm transition-colors">
                            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[var(--color-border)]">
                              <Shield size={14} className="text-[var(--color-primary)]" />
                              <h2 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Security & Password</h2>
                            </div>

                            {checkingPassword ? (
                              <div className="text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider flex h-full items-center justify-center">Checking status...</div>
                            ) : (
                              <div className="space-y-3">
                                {!hasPassword && (
                                  <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 sm:px-5 py-2.5 sm:py-4 rounded-lg sm:rounded-2xl font-sans text-[10px] uppercase tracking-wider flex items-center gap-2 mb-3 font-medium">
                                    <AlertCircle size={14} /> No password set for this account.
                                  </div>
                                )}
                                
                                {hasPassword && (
                                  <div>
                                    <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">Current Password</label>
                                    <input 
                                      type="password" 
                                      value={currentPassword}
                                      onChange={e => setCurrentPassword(e.target.value)}
                                      placeholder="••••••••"
                                      className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="block font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mb-1 font-semibold">New Password</label>
                                  <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[var(--color-primary-text)] focus:outline-none font-sans text-xs"
                                  />
                                </div>

                                <div className="pt-1.5">
                                  <button 
                                    onClick={handleChangePassword}
                                    disabled={updatingPassword}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-primary)] text-black font-sans text-[10px] sm:text-xs uppercase tracking-wider rounded-xl hover:bg-[var(--color-primary-hover)] transition-all shadow-sm font-bold cursor-pointer disabled:opacity-70"
                                  >
                                    {updatingPassword ? (hasPassword ? 'Updating...' : 'Setting...') : (hasPassword ? 'Update Password' : 'Set Password')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm transition-colors">
                            <div className="flex items-center gap-2.5 sm:gap-4">
                              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] flex items-center justify-center shrink-0">
                                <Shield size={15} className="text-[var(--color-primary)]" />
                              </div>
                              <div>
                                <h3 className="text-[var(--color-primary-text)] font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Two-Factor Authentication</h3>
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

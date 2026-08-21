import React, { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, CalendarDays, Users, Scissors, Settings as SettingsIcon, ChevronRight, User, Shield, Lock, AlertCircle, Camera, Download, Search, RefreshCw, X, Check } from 'lucide-react';
import { authClient } from '../lib/auth';
import { DataPagination } from '../components/ui/pagination';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

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

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const;

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

// --- Inline Confirm Button ---
function ConfirmButton({
  label,
  confirmLabel = 'Confirm',
  onConfirm,
  className,
  confirmClassName,
  ariaLabel,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className: string;
  confirmClassName: string;
  ariaLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirming) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setConfirming(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [confirming]);

  if (confirming) {
    return (
      <motion.div 
        ref={ref} 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-[#ffffff15]" 
        role="alert" 
        aria-live="assertive"
      >
        <span className="text-[9px] uppercase tracking-widest text-[#888] px-2">Sure?</span>
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          className={confirmClassName}
          aria-label={`Confirm: ${ariaLabel || label}`}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-md border border-transparent text-[#888] text-[9px] uppercase tracking-widest hover:text-white hover:bg-[#ffffff10] transition-colors"
          aria-label="Cancel confirmation"
        >
          No
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setConfirming(true)}
      className={className}
      aria-label={ariaLabel || label}
    >
      {label}
    </motion.button>
  );
}

// --- Status Badge ---
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'text-[#C5A059] border-[#C5A059]/50 bg-[#C5A059]/10',
    ACCEPTED: 'text-[#4ade80] border-[#4ade80]/50 bg-[#4ade80]/10',
    REJECTED: 'text-red-400 border-red-400/50 bg-red-400/10',
    CANCELLED: 'text-[#555] border-[#555] bg-[#ffffff05]',
    COMPLETED: 'text-[#D4D4D4] border-[#ffffff30] bg-[#ffffff05]',
  };
  return (
    <span
      className={`border rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-sans ${colors[status] || colors.PENDING}`}
      role="status"
      aria-label={`Status: ${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

// --- Stat Card with SVG Sparkline ---
function StatCard({ label, value, icon, accent = false, pathData }: { label: string; value: number | string; icon?: React.ReactNode, accent?: boolean, pathData: string }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(197,160,89,0.1)' }}
      className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#ffffff15] p-5 flex flex-col justify-between aspect-[4/3] transition-all group"
    >
      <div className="flex items-center gap-2 text-[#888] z-10">
        {icon}
        <span className="font-sans text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <motion.span 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className={`text-5xl font-light z-10 ${accent ? 'text-[#C5A059]' : 'text-white'}`}
      >
        {value}
      </motion.span>
      
      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
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
            stroke="#C5A059"
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
  const fetchAll = useCallback(() => {
    setLoading(true);
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Customer map for booking display ---
  const customerMap: Record<string, Customer> = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  // --- Booking actions ---
  const handleBookingAction = async (id: string, action: string) => {
    const res = await fetch(`/api/admin/bookings/${id}/${action}`, { method: 'POST' });
    if (res.ok) {
      fetchAll();
      showToast(`Booking ${action}ed`);
    } else {
      showToast('Failed to update booking', 'error');
    }
  };

  // --- Customer actions ---
  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchAll();
      showToast('Customer deleted');
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to delete', 'error');
    }
  };

  const handleToggleRole = async (id: string) => {
    const res = await fetch(`/api/admin/customers/${id}/role`, { method: 'PATCH' });
    if (res.ok) {
      fetchAll();
      showToast('Role updated');
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to update role', 'error');
    }
  };

  const handleSaveCustomerEdit = async (id: string) => {
    if (!editCustomerName.trim()) return showToast('Customer name cannot be empty', 'error');
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editCustomerName.trim(),
        email: editCustomerEmail.trim() || undefined
      }),
    });
    if (res.ok) {
      fetchAll();
      setEditingCustomerId(null);
      showToast('Customer updated successfully');
    } else {
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
      fetchAll();
      showToast('Service created');
    } else {
      showToast('Failed to create service', 'error');
    }
  };

  const handleToggleServiceActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      fetchAll();
      showToast(active ? 'Service deactivated' : 'Service activated');
    } else {
      showToast('Failed to update service', 'error');
    }
  };

  const handleSaveServiceEdit = async (id: string) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editServiceName.trim(), durationMinutes: editServiceDuration }),
    });
    if (res.ok) {
      setEditingServiceId(null);
      fetchAll();
      showToast('Service updated');
    } else {
      showToast('Failed to update service', 'error');
    }
  };

  // --- Settings ---
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) showToast('Settings saved');
    else showToast('Failed to save settings', 'error');
    setLoading(false);
  };

  // --- Filtered & Paginated data ---
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
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
  const todayBookings = bookings.filter(b => b.bookingDate === today).length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
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

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        
        {/* ======================== DESKTOP SIDEBAR ======================== */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:flex flex-col w-64 border-r border-[#ffffff08] bg-[#080808] h-full"
        >
          <div className="p-8">
            <h4 className="font-sans text-[9px] uppercase tracking-[0.5em] text-[#C5A059] mb-3">Management</h4>
            <h1 className="text-3xl font-light text-white italic tracking-tight">Admin</h1>
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
                  className={`relative flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-xs uppercase tracking-widest transition-all duration-300 overflow-hidden outline-none ${
                    isActive
                      ? 'text-[#C5A059] bg-[#C5A059]/10 shadow-[inset_0_0_20px_rgba(197,160,89,0.05)]'
                      : 'text-[#666] hover:text-white hover:bg-[#ffffff05]'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActiveIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A059] rounded-r-full shadow-[0_0_10px_#C5A059]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {tab.icon}
                  {tab.label}
                  {tab.key === 'bookings' && pendingCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ======================== MAIN CONTENT AREA ======================== */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#050505]">
          <div className="p-4 sm:p-8 md:p-12 pb-24 sm:pb-12 min-h-full flex flex-col">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center justify-center h-64 text-[#C5A059] font-sans text-xs uppercase tracking-widest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  className="space-y-8 flex-1 flex flex-col"
                >

                  {/* ======================== OVERVIEW TAB ======================== */}
                  {activeTab === 'overview' && (
                    <>
                      <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">Good morning, <span className="text-[#C5A059] italic">Admin.</span></h1>
                        <button className="flex items-center gap-2 text-[#C5A059] bg-[#C5A059]/10 px-4 py-2 rounded-full font-sans text-[11px] tracking-widest hover:bg-[#C5A059]/20 transition-colors border border-[#C5A059]/30 shadow-[0_0_15px_rgba(197,160,89,0.1)]">
                          <span className="w-6 h-6 rounded-full bg-[#C5A059] text-black flex items-center justify-center">
                            <ChevronRight size={14} />
                          </span>
                          This Week ({weekStartStr} - {weekEndStr})
                        </button>
                      </motion.div>

                      <motion.div variants={listVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarDays size={18} />} pathData={sparkline1} />
                        <StatCard label="Pending Approval" value={pendingCount} icon={<LayoutDashboard size={18} />} accent={pendingCount > 0} pathData={sparkline2} />
                        <StatCard label="Total Customers" value={totalCustomers} icon={<Users size={18} />} pathData={sparkline3} />
                        <StatCard label="Completed Week" value={completedThisWeek} icon={<Scissors size={18} />} pathData={sparkline4} />
                      </motion.div>

                      {/* Large Trend Chart (Decorative) */}
                      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#ffffff15] p-6 md:p-8 shadow-[0_0_20px_rgba(197,160,89,0.02)] h-64 group">
                        <div className="flex items-center justify-between z-10 relative">
                          <div className="text-[#888] font-sans text-[11px] uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            Weekly Booking Trends
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                            <defs>
                              <linearGradient id="grad-big" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#C5A059" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
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
                              stroke="#C5A059" 
                              strokeWidth="1" 
                              className="drop-shadow-[0_0_10px_rgba(197,160,89,0.8)]" 
                            />
                          </svg>
                        </div>
                      </motion.div>

                      {/* Quick pending list */}
                      {pendingCount > 0 && (
                        <motion.div variants={itemVariants} className="mt-8">
                          <h2 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#888] mb-6">
                            Awaiting Approval
                          </h2>
                          <motion.div variants={listVariants} className="space-y-4">
                            {bookings
                              .filter(b => b.status === 'PENDING')
                              .slice(0, 5)
                              .map(b => (
                                <motion.div
                                  variants={listItemVariants}
                                  whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                  key={b.id}
                                  className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#ffffff15] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-4 mb-2">
                                      <span className="text-white font-medium text-lg">{serviceMap[b.serviceId] || 'Service'}</span>
                                      <StatusBadge status={b.status} />
                                    </div>
                                    <div className="font-sans text-[11px] text-[#888] uppercase tracking-widest flex items-center gap-3">
                                      <span className="text-[#C5A059]">{customerMap[b.userId]?.name || 'Unknown'}</span>
                                      <span className="w-1 h-1 rounded-full bg-[#555]" />
                                      {format(parseISO(b.bookingDate), 'MMM d')}
                                      <span className="w-1 h-1 rounded-full bg-[#555]" />
                                      {b.startTime}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleBookingAction(b.id, 'accept')}
                                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#C5A059] text-black font-sans text-[10px] uppercase tracking-widest hover:bg-[#d4b06a] transition-colors shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                                      aria-label={`Accept booking from ${customerMap[b.userId]?.name || 'unknown'}`}
                                    >
                                      Accept
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleBookingAction(b.id, 'reject')}
                                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-[#ffffff15] text-[#888] font-sans text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                      aria-label={`Reject booking from ${customerMap[b.userId]?.name || 'unknown'}`}
                                    >
                                      Reject
                                    </motion.button>
                                  </div>
                                </motion.div>
                              ))}
                            {pendingCount > 5 && (
                              <motion.button
                                variants={listItemVariants}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => { setActiveTab('bookings'); setStatusFilter('PENDING'); }}
                                className="w-full py-4 rounded-2xl border border-[#ffffff15] bg-[#0a0a0a] text-[#C5A059] font-sans text-[11px] uppercase tracking-widest hover:bg-[#ffffff05] transition-colors"
                              >
                                View all {pendingCount} pending bookings →
                              </motion.button>
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* ======================== BOOKINGS TAB ======================== */}
                  {activeTab === 'bookings' && (
                    <div className="flex-1 flex flex-col">
                      <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between mb-6 shrink-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-wrap gap-1.5 bg-[#0a0a0a] p-1.5 rounded-xl border border-[#1f1f1f]" role="group" aria-label="Filter bookings by status">
                            {STATUS_FILTERS.map(sf => {
                              const countForFilter = sf === 'ALL' ? bookings.length : bookings.filter(b => b.status === sf).length;
                              return (
                                <button
                                  key={sf}
                                  onClick={() => setStatusFilter(sf)}
                                  aria-pressed={statusFilter === sf}
                                  className={`px-3.5 py-2 rounded-lg text-[10px] uppercase tracking-widest font-sans font-medium transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer ${
                                    statusFilter === sf
                                      ? 'bg-[#E5C378] text-black shadow-[0_0_12px_rgba(229,195,120,0.3)]'
                                      : 'text-[#888888] hover:text-white hover:bg-[#141414]'
                                  }`}
                                >
                                  <span>{sf}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${statusFilter === sf ? 'bg-black/20 text-black' : 'bg-[#1c1c1c] text-[#737373]'}`}>
                                    {countForFilter}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={exportBookingsToCSV}
                            className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#1c1c1c] text-[#d4d4d4] hover:text-white border border-[#262626] font-sans text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                            title="Export filtered bookings to CSV"
                          >
                            <Download size={14} className="text-[#E5C378]" />
                            <span>Export CSV</span>
                          </button>
                        </div>

                        <div className="relative w-full lg:w-80">
                          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252]" />
                          <input
                            type="search"
                            placeholder="Search customer, service..."
                            value={bookingSearch}
                            onChange={e => setBookingSearch(e.target.value)}
                            aria-label="Search bookings by customer or service"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] text-white placeholder-[#525252] focus:outline-none focus:border-[#E5C378] font-sans text-xs tracking-wider transition-all"
                          />
                          {bookingSearch && (
                            <button
                              onClick={() => setBookingSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl min-h-[400px]">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[800px]" aria-label="Bookings table">
                            <thead className="border-b border-[#1f1f1f] bg-[#0e0e0e] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Date & Time</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Customer</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Service</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Status</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#171717]">
                              {filteredBookings.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-8 py-24 text-center text-[#555] font-sans text-[11px] uppercase tracking-widest">
                                    {bookingSearch || statusFilter !== 'ALL' ? 'No bookings match your filters' : 'No bookings found'}
                                  </td>
                                </tr>
                              ) : paginatedBookings.map((b, i) => {
                                const customer = customerMap[b.userId];
                                return (
                                  <motion.tr 
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    key={b.id} 
                                    className="hover:bg-[#121212] transition-colors group"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="text-white tracking-wider mb-0.5 text-xs font-medium">{format(parseISO(b.bookingDate), 'MMM d, yyyy')}</div>
                                      <div className="text-[11px] text-[#737373] tracking-widest uppercase">{b.startTime} – {b.endTime}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-[#E5C378] font-medium text-sm mb-0.5">{customer?.name || 'Unknown'}</div>
                                      <div className="text-[11px] text-[#737373]">{customer?.email || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 font-normal text-[#d4d4d4] text-xs">{serviceMap[b.serviceId] || 'Unknown'}</td>
                                    <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {b.status === 'PENDING' && (
                                          <>
                                            <button onClick={() => handleBookingAction(b.id, 'accept')} className="px-3.5 py-1.5 rounded-lg bg-[#E5C378]/10 text-[#E5C378] hover:bg-[#E5C378] hover:text-black text-[10px] uppercase tracking-widest transition-all font-semibold">Accept</button>
                                            <button onClick={() => handleBookingAction(b.id, 'reject')} className="px-3.5 py-1.5 rounded-lg text-[#888] hover:bg-red-500/10 hover:text-red-400 text-[10px] uppercase tracking-widest transition-all">Reject</button>
                                          </>
                                        )}
                                        {b.status === 'ACCEPTED' && (
                                          <>
                                            <button onClick={() => handleBookingAction(b.id, 'complete')} className="px-3.5 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-[10px] uppercase tracking-widest transition-all font-semibold">Complete</button>
                                            <button onClick={() => handleBookingAction(b.id, 'cancel')} className="px-3.5 py-1.5 rounded-lg text-[#888] hover:bg-red-500/10 hover:text-red-400 text-[10px] uppercase tracking-widest transition-all">Cancel</button>
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
                      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 shrink-0">
                        <div className="font-sans text-xs uppercase tracking-widest text-[#737373] flex items-center gap-2" aria-live="polite">
                          <Users size={16} className="text-[#E5C378]" />
                          <span>
                            <strong className="text-white text-lg font-medium mr-1.5">{filteredCustomers.length}</strong>
                            Registered Customer{filteredCustomers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="relative w-full sm:w-80">
                          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252]" />
                          <input
                            type="search"
                            placeholder="Search by name or email..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] text-white placeholder-[#525252] focus:outline-none focus:border-[#E5C378] font-sans text-xs tracking-wider transition-all"
                          />
                          {customerSearch && (
                            <button
                              onClick={() => setCustomerSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-1"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl min-h-[400px]">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[700px]">
                            <thead className="border-b border-[#1f1f1f] bg-[#0e0e0e] sticky top-0 z-10">
                              <tr>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Customer</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium">Role</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium text-center">Bookings</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium text-right">Joined</th>
                                <th scope="col" className="px-6 py-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[#737373] font-medium text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#171717]">
                              {filteredCustomers.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-8 py-24 text-center text-[#555] font-sans text-[11px] uppercase tracking-widest">
                                    {customerSearch ? 'No customers match your search' : 'No registered customers found'}
                                  </td>
                                </tr>
                              ) : paginatedCustomers.map((c, i) => (
                                <motion.tr 
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.03 }}
                                  key={c.id} 
                                  className="hover:bg-[#121212] transition-colors group"
                                >
                                  <td className="px-6 py-4">
                                    {editingCustomerId === c.id ? (
                                      <div className="space-y-2 max-w-xs">
                                        <input
                                          type="text"
                                          value={editCustomerName}
                                          onChange={e => setEditCustomerName(e.target.value)}
                                          placeholder="Customer Name"
                                          className="w-full px-3 py-1.5 rounded-lg bg-[#111] border border-[#E5C378] text-white text-xs outline-none focus:shadow-[0_0_10px_rgba(229,195,120,0.2)]"
                                          autoFocus
                                        />
                                        <input
                                          type="email"
                                          value={editCustomerEmail}
                                          onChange={e => setEditCustomerEmail(e.target.value)}
                                          placeholder="Customer Email"
                                          className="w-full px-3 py-1.5 rounded-lg bg-[#111] border border-[#333] text-[#aaa] text-xs outline-none focus:border-[#E5C378]"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-white font-medium text-sm mb-0.5">{c.name}</div>
                                        <div className="text-[#737373] text-xs font-sans">{c.email}</div>
                                      </>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-sans font-medium ${c.role === 'ADMIN' ? 'text-[#E5C378] bg-[#E5C378]/10 border border-[#E5C378]/30 shadow-[0_0_8px_rgba(229,195,120,0.2)]' : 'text-[#888] bg-[#141414] border border-[#262626]'}`}>
                                      {c.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-white font-normal text-sm">{c.bookingCount}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-[#737373] text-xs font-sans">
                                    {c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      {editingCustomerId === c.id ? (
                                        <>
                                          <button
                                            onClick={() => handleSaveCustomerEdit(c.id)}
                                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all font-semibold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingCustomerId(null)}
                                            className="px-3.5 py-1.5 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-white text-[10px] uppercase tracking-widest transition-all"
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
                                            className="px-3 py-1.5 rounded-lg text-[#E5C378] hover:bg-[#E5C378]/10 text-[10px] uppercase tracking-widest transition-all font-medium"
                                          >
                                            Edit
                                          </button>
                                          {c.id !== adminUser?.id && (
                                            <>
                                              <ConfirmButton
                                                label={c.role === 'ADMIN' ? 'Demote' : 'Promote'}
                                                onConfirm={() => handleToggleRole(c.id)}
                                                className="px-3 py-1.5 rounded-lg text-[#888] hover:bg-[#1a1a1a] hover:text-white text-[10px] uppercase tracking-widest transition-all"
                                                confirmClassName="px-3 py-1.5 rounded-lg bg-[#E5C378] text-black text-[10px] uppercase tracking-widest hover:bg-[#eed79b] transition-all"
                                              />
                                              <ConfirmButton
                                                label="Delete"
                                                confirmLabel="Confirm?"
                                                onConfirm={() => handleDeleteCustomer(c.id)}
                                                className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-[10px] uppercase tracking-widest transition-all"
                                                confirmClassName="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                              />
                                            </>
                                          )}
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
                      <motion.form variants={itemVariants} onSubmit={handleAddService} className="shrink-0 p-8 rounded-2xl bg-[#0a0a0a] border border-[#ffffff15] shadow-2xl space-y-6 mb-8">
                        <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
                            <Scissors size={14}/>
                          </div>
                          Add New Service
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={newServiceName}
                              onChange={e => setNewServiceName(e.target.value)}
                              placeholder="Service Name (e.g. Haircut)"
                              required
                              className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white placeholder-[#555] focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all"
                            />
                          </div>
                          <div className="w-full md:w-48">
                            <input
                              type="number"
                              min={5}
                              value={newServiceDuration}
                              onChange={e => setNewServiceDuration(parseInt(e.target.value) || 30)}
                              placeholder="Duration (min)"
                              required
                              className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all"
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="px-8 py-4 rounded-xl bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest font-medium hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)]"
                          >
                            Add Service
                          </motion.button>
                        </div>
                      </motion.form>

                      <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-[#ffffff15] bg-[#0a0a0a] shadow-2xl min-h-[400px]">
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-sm min-w-[600px]">
                            <thead className="border-b border-[#ffffff15] bg-[#111] sticky top-0 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                            <tr>
                              <th scope="col" className="px-8 py-5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#666] font-normal">Service</th>
                              <th scope="col" className="px-8 py-5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#666] font-normal">Duration</th>
                              <th scope="col" className="px-8 py-5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#666] font-normal">Status</th>
                              <th scope="col" className="px-8 py-5 font-sans text-[10px] uppercase tracking-[0.2em] text-[#666] font-normal text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ffffff08]">
                            {allServices.map((s, i) => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={s.id} 
                                className={`hover:bg-[#ffffff05] transition-colors group ${!s.active ? 'opacity-40 grayscale' : ''}`}
                              >
                                <td className="px-8 py-5">
                                  {editingServiceId === s.id ? (
                                    <input value={editServiceName} onChange={e => setEditServiceName(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#111] border border-[#C5A059] text-white outline-none font-sans text-sm w-full focus:shadow-[0_0_10px_rgba(197,160,89,0.2)] transition-shadow" autoFocus />
                                  ) : <span className="text-white font-medium text-[15px]">{s.name}</span>}
                                </td>
                                <td className="px-8 py-5">
                                  {editingServiceId === s.id ? (
                                    <input type="number" min={5} value={editServiceDuration} onChange={e => setEditServiceDuration(parseInt(e.target.value) || 30)} className="w-24 px-4 py-2.5 rounded-lg bg-[#111] border border-[#C5A059] text-white outline-none font-sans text-sm focus:shadow-[0_0_10px_rgba(197,160,89,0.2)] transition-shadow" />
                                  ) : <span className="text-[#aaa]">{s.durationMinutes} <span className="text-[#666] text-xs ml-1">MIN</span></span>}
                                </td>
                                <td className="px-8 py-5">
                                  <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest border ${s.active ? 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'text-[#555] border-[#ffffff15] bg-[#ffffff05]'}`}>
                                    {s.active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingServiceId === s.id ? (
                                      <>
                                        <button onClick={() => handleSaveServiceEdit(s.id)} className="px-4 py-2 rounded-lg bg-[#4ade80] text-black text-[10px] uppercase tracking-widest hover:bg-[#3baf64] transition-all shadow-[0_0_10px_rgba(74,222,128,0.2)]">Save</button>
                                        <button onClick={() => setEditingServiceId(null)} className="px-4 py-2 rounded-lg text-[#888] hover:bg-[#ffffff10] hover:text-white text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setEditingServiceId(s.id); setEditServiceName(s.name); setEditServiceDuration(s.durationMinutes); }} className="px-4 py-2 rounded-lg text-[#C5A059] hover:bg-[#C5A059]/10 text-[10px] uppercase tracking-widest transition-all">Edit</button>
                                        <button onClick={() => handleToggleServiceActive(s.id, s.active)} className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${s.active ? 'text-[#888] hover:bg-red-500/10 hover:text-red-400' : 'text-[#4ade80] hover:bg-[#4ade80]/10'}`}>{s.active ? 'Deactivate' : 'Activate'}</button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                        {/* Fake footer to anchor the bottom of the table block */}
                        <div className="shrink-0 p-4 border-t border-[#ffffff15] bg-[#0a0a0a] text-center text-[9px] uppercase tracking-[0.2em] text-[#555]">
                          End of Services
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ======================== SETTINGS TAB ======================== */}
                  {activeTab === 'settings' && (
                    <motion.div variants={itemVariants}>
                      <form onSubmit={handleSettingsSubmit} className="space-y-8 max-w-2xl p-8 md:p-12 rounded-3xl bg-[#0a0a0a] border border-[#ffffff15] shadow-2xl">
                        <div className="border-b border-[#ffffff15] pb-6 mb-8">
                          <h2 className="text-3xl font-light text-white flex items-center gap-4"><SettingsIcon className="text-[#C5A059]" size={28}/> Shop Configuration</h2>
                          <p className="text-[#666] font-sans text-xs mt-3">Manage your salon's operating hours and booking rules.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] ml-1">Opening Time</label>
                            <input type="time" value={settings.openingTime || ''} onChange={e => setSettings({ ...settings, openingTime: e.target.value })} className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all" required />
                          </div>
                          <div className="space-y-2">
                            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] ml-1">Closing Time</label>
                            <input type="time" value={settings.closingTime || ''} onChange={e => setSettings({ ...settings, closingTime: e.target.value })} className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all" required />
                          </div>
                          <div className="space-y-2">
                            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] ml-1">Slot Duration <span className="text-[#666] lowercase tracking-normal">(minutes)</span></label>
                            <input type="number" value={settings.slotDurationMinutes || ''} onChange={e => setSettings({ ...settings, slotDurationMinutes: parseInt(e.target.value) })} className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all" required />
                          </div>
                          <div className="space-y-2">
                            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-[#C5A059] ml-1">Min Advance <span className="text-[#666] lowercase tracking-normal">(minutes)</span></label>
                            <input type="number" value={settings.minimumAdvanceMinutes || ''} onChange={e => setSettings({ ...settings, minimumAdvanceMinutes: parseInt(e.target.value) })} className="w-full px-5 py-4 rounded-xl bg-[#111] border border-[#ffffff15] text-white focus:outline-none focus:border-[#C5A059] focus:shadow-[0_0_15px_rgba(197,160,89,0.1)] font-sans text-sm transition-all" required />
                          </div>
                        </div>
                        
                        <div className="pt-6">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            className="w-full py-5 rounded-xl bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)]"
                          >
                            Save Settings
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  {/* ======================== PROFILE TAB ======================== */}
                  {activeTab === 'profile' && (
                    <motion.div variants={itemVariants} className="space-y-6">
                      
                      {/* Top Banner (Avatar & Basic Info) */}
                      <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C5A059]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
                        
                        <div className="relative group shrink-0 z-10">
                          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-[#C5A059] to-[#C5A059]/20 flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden relative">
                              {newImage || adminUser?.image ? (
                                <img src={newImage || adminUser?.image} alt={adminUser?.name || 'Admin'} className="w-full h-full object-cover" />
                              ) : (
                                <User size={48} className="text-[#888]" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left z-10">
                          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">{adminUser?.name || 'Admin'}</h1>
                          <p className="text-[#888] font-sans text-[11px] uppercase tracking-[0.2em] mb-4">{adminUser?.email || 'admin@example.com'}</p>
                          
                          <div className="inline-flex px-4 py-1.5 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] font-sans text-[9px] uppercase tracking-[0.2em]">
                            Administrator
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Left Column: Account Details */}
                        <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 flex flex-col shadow-xl">
                          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#ffffff10]">
                            <User size={16} className="text-[#C5A059]" />
                            <h2 className="text-[#C5A059] font-sans text-[10px] uppercase tracking-[0.3em]">Account Details</h2>
                          </div>
                          
                          <div className="space-y-6 flex-1">
                            <div>
                              <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">Full Name</label>
                              <input 
                                type="text" 
                                value={isEditingProfile ? newName : adminUser?.name || ''}
                                onChange={e => setNewName(e.target.value)}
                                disabled={!isEditingProfile}
                                className="w-full bg-[#111] border border-[#ffffff10] rounded-2xl px-5 py-4 text-[#D4D4D4] focus:outline-none focus:border-[#C5A059]/50 transition-colors font-light disabled:opacity-70"
                              />
                            </div>
                            
                            <div>
                              <label className="block font-sans text-[9px] uppercase tracking-[0.2em] text-[#555] mb-2 ml-1">Email Address</label>
                              <input 
                                type="email" 
                                value={adminUser?.email || ''}
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
                              {updatingProfile ? 'Saving...' : isEditingProfile ? 'Save Profile' : 'Edit Profile'}
                            </button>
                            
                            {isEditingProfile && (
                              <button 
                                onClick={() => {
                                  setIsEditingProfile(false);
                                  setNewName(adminUser?.name || '');
                                  setNewImage(adminUser?.image || '');
                                }}
                                className="px-8 py-3 rounded-2xl bg-transparent border border-[#ffffff20] text-[#888] font-sans text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Security */}
                        <div className="space-y-6 flex flex-col">
                          <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-8 sm:p-10 flex-1 shadow-xl">
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
                          </div>

                          <div className="bg-[#0a0a0a] border border-[#ffffff10] rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-6 shadow-xl">
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
                              onClick={() => showToast('2FA setup sent to email')}
                              className="w-12 h-6 rounded-full transition-colors relative bg-[#333]"
                            >
                              <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all left-1" />
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080808] border-t border-[#ffffff10] pb-safe pt-1 px-2 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
        <div role="tablist" className="flex justify-around items-center h-[72px]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors outline-none ${
                  isActive ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(197,160,89,0.8)]' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[8px] uppercase tracking-widest font-sans font-medium transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute bottom-2'}`}>
                  {tab.label}
                </span>
                {tab.key === 'bookings' && pendingCount > 0 && (
                  <span className="absolute top-2 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {pendingCount}
                  </span>
                )}
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-[#C5A059] rounded-full shadow-[0_0_8px_#C5A059]"
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

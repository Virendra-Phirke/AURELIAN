import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { format, parseISO, formatDistanceToNow, differenceInMinutes, isToday, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

import {
  CalendarDays, Clock, User, History, Settings, Camera,
  ArrowRight, Phone, Sparkles, TrendingUp, ChevronDown,
  Zap, Timer, MapPin, CheckCircle, XCircle, AlertCircle, Star,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import { authClient } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { DataPagination } from '../components/ui/pagination';
import { BorderBeam } from '../components/magicui/border-beam';
import { NumberTicker } from '../components/magicui/number-ticker';
import { SparklesText } from '../components/magicui/sparkles-text';
import { Skeleton, StatCardSkeleton } from '../components/ui/skeleton';
import { formatTime12, formatTimeRange12 } from '../lib/utils';
import { useLiveEvents } from '../lib/useLiveEvents';

// --- Types ---
type Booking = {
  id: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  status: string;
  customerNote?: string;
  createdAt: string;
};

type ShopSettings = {
  openingTime?: string;
  closingTime?: string;
  slotDurationMinutes?: number;
  minimumAdvanceMinutes?: number;
};

// --- Animation Variants ---
const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// --- Helper: Time Greeting ---
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// --- Status Badge Component (Memoized) ---
const StatusBadge = React.memo(function StatusBadge({ status }: { status: string }) {
  const displayLabel = status === 'ACCEPTED' ? 'CONFIRMED' : status;
  const colors: Record<string, string> = {
    CONFIRMED: 'text-emerald-500 bg-emerald-500/10 font-bold',
    PENDING: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-bold',
    COMPLETED: 'text-[var(--color-primary-text)] bg-[var(--color-surface-raised)] font-medium',
    CANCELLED: 'text-[var(--color-muted-text)] bg-[var(--color-surface-raised)] font-medium',
    REJECTED: 'text-red-500 bg-red-500/10 font-bold',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[8.5px] uppercase tracking-wider font-sans inline-flex items-center gap-1 ${colors[status] || colors.CONFIRMED}`}
      role="status"
      aria-label={`Status: ${displayLabel.toLowerCase()}`}
    >
      {displayLabel}
    </span>
  );
});

// --- Toast (Geist Minimal) ---
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

// --- Stat Card with Sparkline & Magic UI (Memoized) ---
const StatCard = React.memo(function StatCard({ label, value, subtext, icon, accent = false, pathData }: {
  label: string; value: string | number; subtext?: string; icon: React.ReactNode; accent?: boolean; pathData: string;
}) {
  const isNum = typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && !value.includes('%') && !value.includes('m') && !value.includes('★'));
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(229,195,120,0.12)' }}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-3 sm:p-4 flex flex-col justify-between h-20 sm:h-24 transition-all group shadow-sm hover:shadow-md"
    >
      {accent && <BorderBeam size={60} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />}
      <div className="flex items-center justify-between z-10">
        <span className="font-sans text-[8.5px] sm:text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] font-bold">{label}</span>
        <div className="text-[var(--color-primary)] scale-85 sm:scale-95">{icon}</div>
      </div>
      <div className="z-10">
        <div className={`text-lg sm:text-2xl font-sans font-bold tracking-tight block ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary-text)]'}`}>
          {isNum ? <NumberTicker value={Number(value)} /> : value}
        </div>
        {subtext && (
          <span className="font-sans text-[8px] sm:text-[9px] uppercase tracking-wider text-[var(--color-muted-text)] mt-0.5 block truncate font-medium">{subtext}</span>
        )}
      </div>

      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 opacity-25 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`sg-${label.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${pathData} L100,40 L0,40 Z`} fill={`url(#sg-${label.replace(/\s+/g, '')})`} />
          <path d={pathData} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </motion.div>
  );
});

// ========================
// Main Dashboard Component
// ========================
export default function Dashboard() {
  const navigate = useNavigate();
  const { data: sessionData, isPending } = authClient.useSession();
  const user = (sessionData as any)?.user;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Record<string, string>>({});
  const [shopSettings, setShopSettings] = useState<ShopSettings>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [showPastHistory, setShowPastHistory] = useState(false);

  const fetchData = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/shop').then(r => r.json()),
    ]).then(([bData, sData, shopData]) => {
      setBookings(Array.isArray(bData) ? bData : []);
      const sMap: Record<string, string> = {};
      (Array.isArray(sData) ? sData : []).forEach((s: any) => { sMap[s.id] = s.name; });
      setServices(sMap);
      setShopSettings(shopData || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(true); }, [fetchData]);

  // Real-Time Server-Sent Event Triggers (Zero DB polling overhead)
  useLiveEvents(useMemo(() => ({
    bookings_updated: () => fetchData(false),
    services_updated: () => fetchData(false),
    settings_updated: () => fetchData(false),
    availability_updated: () => fetchData(false),
  }), [fetchData]));

  const handleCancel = useCallback(async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      setToast({ message: 'Appointment cancelled', type: 'success' });
    } else {
      const data = await res.json().catch(() => ({}));
      setToast({ message: data.error || 'Failed to cancel appointment', type: 'error' });
    }
    setConfirmingCancel(null);
  }, []);

  // --- Derived Data ---
  const upcoming = useMemo(() =>
    bookings.filter(b => b.status === 'PENDING' || b.status === 'ACCEPTED')
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate) || a.startTime.localeCompare(b.startTime)),
    [bookings]
  );

  const past = useMemo(() =>
    bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED')
      .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)),
    [bookings]
  );

  const [pastPage, setPastPage] = useState(1);
  const [pastPageSize, setPastPageSize] = useState(5);

  const paginatedPast = useMemo(() => {
    const start = (pastPage - 1) * pastPageSize;
    return past.slice(start, start + pastPageSize);
  }, [past, pastPage, pastPageSize]);

  const pastTotalPages = Math.max(1, Math.ceil(past.length / pastPageSize));

  const todayBookings = useMemo(() =>
    bookings.filter(b =>
      isToday(parseISO(b.bookingDate)) &&
      (b.status === 'PENDING' || b.status === 'ACCEPTED')
    ),
    [bookings]
  );

  const completedCount = past.filter(b => b.status === 'COMPLETED').length;
  const activeCount = upcoming.length;

  // Next appointment info
  const nextAppointment = upcoming[0];
  const nextAppointmentCountdown = useMemo(() => {
    if (!nextAppointment) return null;
    try {
      const aptDate = parseISO(nextAppointment.bookingDate);
      return formatDistanceToNow(aptDate, { addSuffix: true });
    } catch { return null; }
  }, [nextAppointment]);

  // Member since
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), 'MMM yyyy')
    : 'Active';

  // Recent activity
  const recentActivity = useMemo(() =>
    [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [bookings]
  );

  // Shop status
  const isShopOpen = useMemo(() => {
    if (!shopSettings.openingTime || !shopSettings.closingTime) return null;
    const now = new Date();
    const [openH, openM] = shopSettings.openingTime.split(':').map(Number);
    const [closeH, closeM] = shopSettings.closingTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }, [shopSettings]);

  // Sparkline paths
  const spark1 = "M0,30 Q10,20 20,25 T40,15 T60,30 T80,10 T100,18";
  const spark2 = "M0,35 Q15,30 30,20 T60,30 T85,12 T100,8";
  const spark3 = "M0,25 Q20,30 35,20 T60,10 T80,28 T100,15";
  const spark4 = "M0,18 Q20,25 40,30 T70,20 T100,25";

  // --- Loading State: Realtime Skeleton ---
  if (loading || isPending) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 pb-12 animate-in fade-in duration-300">
        {/* 1. Welcome Banner Skeleton */}
        <div className="p-3.5 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="w-44 h-5 rounded-md" />
              <Skeleton className="w-64 h-3.5 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-7 rounded-full" />
            <Skeleton className="w-32 h-8 rounded-xl" />
          </div>
        </div>

        {/* 2. Stat Cards Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* 3. Schedule & Salon Hours Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-7 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]">
              <Skeleton className="w-36 h-4 rounded-md" />
              <Skeleton className="w-16 h-3 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]">
              <Skeleton className="w-28 h-4 rounded-md" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-2 py-1">
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
            </div>
            <Skeleton className="w-full h-8 rounded-xl mt-2" />
          </div>
        </div>

        {/* 4. Upcoming Appointments Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-48 h-4 rounded-md" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-32 rounded-xl sm:rounded-2xl" />
            <Skeleton className="h-32 rounded-xl sm:rounded-2xl" />
            <Skeleton className="h-32 rounded-xl sm:rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle size={14} className="text-[#4ade80]" />;
      case 'CANCELLED': return <XCircle size={14} className="text-[#737373]" />;
      case 'REJECTED': return <XCircle size={14} className="text-red-400" />;
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'PENDING': return <CheckCircle size={14} className="text-[#4ade80]" />;
      default: return <Clock size={14} className="text-[#737373]" />;
    }
  };

  const getActivityLabel = (b: Booking) => {
    const sName = services[b.serviceId] || 'Service';
    switch (b.status) {
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'PENDING': return `${sName} confirmed`;
      case 'COMPLETED': return `${sName} completed`;
      case 'CANCELLED': return `${sName} cancelled`;
      case 'REJECTED': return `${sName} declined`;
      default: return `${sName}`;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 pb-12"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          1. WELCOME BANNER (Geist Style)
         ════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="relative p-3.5 sm:p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm transition-colors"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="shrink-0 relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-[var(--color-surface-raised)] group-hover:border-[var(--color-primary)] transition-colors">
                <div className="w-full h-full rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      referrerPolicy="no-referrer"
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="font-sans text-xs sm:text-sm font-bold text-[var(--color-primary)] uppercase">
                      {(user?.name || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <h1 className="text-base sm:text-xl font-light text-[var(--color-primary-text)] tracking-wide">
                {getGreeting()}, <span className="font-medium text-[var(--color-primary)]">{user?.name?.split(' ')[0] || 'Client'}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider mt-0.5">
                <CalendarDays size={11} className="text-[var(--color-primary)]" />
                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                {nextAppointment && (
                  <>
                    <span>•</span>
                    <span className="text-[var(--color-primary)] font-medium">Next: {nextAppointmentCountdown}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/booking')}
              className="flex-1 sm:flex-none px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CalendarDays size={13} />
              Book Appointment
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] rounded-xl transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          2. STAT CARDS (4-column grid)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          label="Next Appointment"
          value={nextAppointment ? format(parseISO(nextAppointment.bookingDate), 'MMM d') : '—'}
          subtext={nextAppointment ? `${formatTimeRange12(nextAppointment.startTime, nextAppointment.endTime)} · ${services[nextAppointment.serviceId] || 'Service'}` : 'None scheduled'}
          icon={<CalendarDays size={15} />}
          accent={!!nextAppointment}
          pathData={spark1}
        />
        <StatCard
          label="Total Visits"
          value={completedCount}
          subtext={`${completedCount} completed`}
          icon={<TrendingUp size={15} />}
          pathData={spark2}
        />
        <StatCard
          label="Active Bookings"
          value={activeCount}
          subtext={activeCount > 0 ? 'Confirmed' : 'None active'}
          icon={<Zap size={15} />}
          accent={activeCount > 0}
          pathData={spark3}
        />
        <StatCard
          label="Membership"
          value={memberSince}
          subtext="Verified client"
          icon={<Star size={15} />}
          pathData={spark4}
        />
      </motion.div>

      {/* ════════════════════════════════════════
          3. TODAY'S SCHEDULE + SHOP INFO (2-col)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Today's Schedule */}
        <div className="lg:col-span-7 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-primary)]" />
                <h3 className="font-sans text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">Today's Schedule</h3>
              </div>
              <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                {format(new Date(), 'MMM d')}
              </span>
            </div>

            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-center">
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center mb-2">
                  <CalendarDays size={16} className="text-[var(--color-secondary-text)]" />
                </div>
                <p className="text-xs text-[var(--color-secondary-text)] font-sans mb-0.5">No appointments scheduled for today</p>
                <p className="font-sans text-[9px] uppercase tracking-wider text-[var(--color-muted-text)]">Your schedule is clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[var(--color-surface-raised)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-[var(--color-primary-text)]">{services[b.serviceId] || 'Service'}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-2 font-sans text-[10px] sm:text-[11px] text-[var(--color-secondary-text)]">
                        <Clock size={11} className="text-[var(--color-primary)]" />
                        <span>{formatTimeRange12(b.startTime, b.endTime)}</span>
                      </div>
                    </div>
                    {(b.status === 'ACCEPTED' || b.status === 'PENDING') && (
                      <div className="self-end sm:self-center">
                        {confirmingCancel === b.id ? (
                          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] p-1 rounded-lg">
                            <span className="text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] px-1">Cancel?</span>
                            <button onClick={() => handleCancel(b.id)} className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Yes</button>
                            <button onClick={() => setConfirmingCancel(null)} className="px-1.5 py-0.5 text-[var(--color-secondary-text)] text-[9px] uppercase tracking-wider hover:text-[var(--color-primary-text)] cursor-pointer">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingCancel(b.id)}
                            className="px-2.5 py-1 rounded-lg text-[var(--color-secondary-text)] font-sans text-[9px] uppercase tracking-wider hover:text-red-500 transition-colors cursor-pointer bg-[var(--color-surface)]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shop Info Widget */}
        <div className="lg:col-span-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--color-primary)]" />
                <h3 className="font-sans text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">Salon Hours</h3>
              </div>
              {isShopOpen !== null && (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-sans font-medium ${
                  isShopOpen ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isShopOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isShopOpen ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>

            <div className="space-y-2 font-sans text-[11px]">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[10px]">Opening Hours</span>
                <span className="text-[var(--color-primary-text)] font-medium">{formatTime12(shopSettings.openingTime || '09:00')} – {formatTime12(shopSettings.closingTime || '19:00')}</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--color-border)]" />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[10px]">Slot Interval</span>
                <span className="text-[var(--color-primary-text)] font-medium">{shopSettings.slotDurationMinutes || 30} minutes</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--color-border)]" />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[10px]">Location</span>
                <span className="text-[var(--color-primary-text)] font-medium">Aurelian Salon & Spa</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/booking')}
            className="mt-3 sm:mt-4 w-full py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-primary)] font-sans text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer text-center"
          >
            Check Available Slots →
          </button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          4. UPCOMING APPOINTMENTS (Card Grid)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[var(--color-primary)]" />
            <h2 className="font-sans text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">Upcoming Appointments</h2>
          </div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-4 sm:p-6 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl text-center space-y-2 shadow-sm transition-colors">
            <div className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] mx-auto flex items-center justify-center">
              <CalendarDays size={16} className="text-[var(--color-secondary-text)]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm text-[var(--color-primary-text)] font-medium mb-0.5">No upcoming appointments</h3>
              <p className="font-sans text-[11px] text-[var(--color-secondary-text)]">Select a service and reserve your preferred time slot.</p>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Book Appointment</span>
              <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
            {upcoming.map((b, idx) => (
              <div
                key={b.id}
                className="relative overflow-hidden p-3.5 sm:p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 rounded-xl sm:rounded-2xl transition-all space-y-2 shadow-sm"
              >
                {idx === 0 && <BorderBeam size={80} duration={9} colorFrom="var(--color-primary)" borderWidth={1.5} />}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-[var(--color-primary-text)] mb-0.5">{services[b.serviceId] || 'Service'}</h4>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] font-sans">{format(parseISO(b.bookingDate), 'MMM d, yyyy')}</div>
                    <div className="font-sans text-[9px] sm:text-[10px] text-[var(--color-secondary-text)] uppercase tracking-wider">{format(parseISO(b.bookingDate), 'EEEE')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-sans text-[10px] sm:text-[11px] text-[var(--color-secondary-text)]">
                  <Clock size={11} className="text-[var(--color-primary)]" />
                  <span>{formatTimeRange12(b.startTime, b.endTime)}</span>
                </div>

                {(b.status === 'ACCEPTED' || b.status === 'PENDING') && (
                  <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
                    {confirmingCancel === b.id ? (
                      <div className="flex items-center gap-1.5 bg-[var(--color-surface-raised)] p-1 rounded-lg">
                        <span className="text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)] px-1">Cancel booking?</span>
                        <button onClick={() => handleCancel(b.id)} className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Yes</button>
                        <button onClick={() => setConfirmingCancel(null)} className="px-1.5 py-0.5 text-[var(--color-secondary-text)] text-[9px] uppercase tracking-wider hover:text-[var(--color-primary-text)] cursor-pointer">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingCancel(b.id)}
                        className="px-2.5 py-1 bg-[var(--color-surface-raised)] rounded-lg text-[var(--color-secondary-text)] font-sans text-[9px] uppercase tracking-wider hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════
          5. RECENT ACTIVITY TIMELINE
         ════════════════════════════════════════ */}
      {recentActivity.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-2">
            <History size={14} className="text-[var(--color-primary)]" />
            <h2 className="font-sans text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-primary-text)] font-semibold">Recent Activity</h2>
          </div>

          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm transition-colors">
            <div className="space-y-3">
              {recentActivity.map((b) => (
                <div key={b.id} className="flex items-start gap-3 pb-2.5 border-b border-[var(--color-border)] last:border-b-0 last:pb-0">
                  <div className="mt-0.5">{getActivityIcon(b.status)}</div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs text-[var(--color-primary-text)] font-medium">{getActivityLabel(b)}</span>
                      <span className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] block font-sans">
                        {format(parseISO(b.bookingDate), 'MMM d, yyyy')} at {formatTime12(b.startTime)}
                      </span>
                    </div>
                    <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] shrink-0">
                      {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════
          6. PAST HISTORY (Collapsible)
         ════════════════════════════════════════ */}
      {past.length > 0 && (
        <motion.div variants={itemVariants}>
          <button
            onClick={() => setShowPastHistory(!showPastHistory)}
            className="w-full flex items-center justify-between p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-2xl transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <History size={14} className="text-[var(--color-primary)]" />
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-primary-text)] font-semibold">
                Past History
              </span>
              <span className="font-sans text-[10px] text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                {past.length}
              </span>
            </div>
            <ChevronDown size={16} className={`text-[var(--color-secondary-text)] transition-transform duration-200 ${showPastHistory ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPastHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)] shadow-md">
                  {paginatedPast.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getActivityIcon(b.status)}
                        <div>
                          <div className="text-xs font-medium text-[var(--color-primary-text)]">{services[b.serviceId] || 'Service'}</div>
                          <div className="font-sans text-[11px] text-[var(--color-secondary-text)]">
                            {format(parseISO(b.bookingDate), 'MMM d, yyyy')} · {formatTimeRange12(b.startTime, b.endTime)}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}

                  <DataPagination
                    currentPage={pastPage}
                    totalPages={pastTotalPages}
                    totalItems={past.length}
                    pageSize={pastPageSize}
                    onPageChange={setPastPage}
                    onPageSizeChange={setPastPageSize}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

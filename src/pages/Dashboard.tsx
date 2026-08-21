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

// --- StatusBadge (Geist Style) ---
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'text-[#E5C378] border-[#E5C378]/40 bg-[#E5C378]/10',
    ACCEPTED: 'text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10',
    REJECTED: 'text-red-400 border-red-400/40 bg-red-400/10',
    CANCELLED: 'text-[#737373] border-[#2e2e2e] bg-[#141414]',
    COMPLETED: 'text-[#d4d4d4] border-[#2e2e2e] bg-[#141414]',
  };
  const isPulse = status === 'ACCEPTED' || status === 'PENDING';
  const dotColor = status === 'ACCEPTED' ? 'bg-[#4ade80]' : 'bg-[#E5C378]';

  return (
    <span className={`border rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-sans inline-flex items-center gap-1.5 font-medium ${colors[status] || colors.PENDING}`}>
      {isPulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`}></span>
        </span>
      )}
      {status}
    </span>
  );
}

// --- Toast (Geist Minimal) ---
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

// --- Stat Card with Sparkline & Magic UI ---
function StatCard({ label, value, subtext, icon, accent = false, pathData }: {
  label: string; value: string | number; subtext?: string; icon: React.ReactNode; accent?: boolean; pathData: string;
}) {
  const isNum = typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && !value.includes('%') && !value.includes('m') && !value.includes('★'));
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 p-5 flex flex-col justify-between min-h-[135px] transition-all group shadow-sm"
    >
      {accent && <BorderBeam size={100} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />}
      <div className="flex items-center justify-between z-10">
        <span className="font-sans text-[11px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold">{label}</span>
        <div className="text-[var(--color-muted-text)] group-hover:text-[var(--color-primary)] transition-colors">{icon}</div>
      </div>
      <div className="z-10 mt-2">
        <div className={`text-3xl font-sans font-semibold tracking-tight block ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary-text)]'}`}>
          {isNum ? <NumberTicker value={Number(value)} /> : value}
        </div>
        {subtext && (
          <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] mt-1 block truncate">{subtext}</span>
        )}
      </div>

      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-25 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
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
}

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

  const fetchData = useCallback(() => {
    setLoading(true);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancel = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      setToast({ message: 'Appointment cancelled', type: 'success' });
    } else {
      setToast({ message: 'Failed to cancel appointment', type: 'error' });
    }
    setConfirmingCancel(null);
  };

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

  // --- Loading State ---
  if (loading || isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-[#E5C378] border-t-transparent animate-spin" />
        <span className="font-sans text-xs uppercase tracking-widest text-[#737373]">Loading dashboard...</span>
      </div>
    );
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle size={14} className="text-[#4ade80]" />;
      case 'CANCELLED': return <XCircle size={14} className="text-[#737373]" />;
      case 'REJECTED': return <XCircle size={14} className="text-red-400" />;
      case 'ACCEPTED': return <CheckCircle size={14} className="text-[#4ade80]" />;
      case 'PENDING': return <AlertCircle size={14} className="text-[#E5C378]" />;
      default: return <Clock size={14} className="text-[#737373]" />;
    }
  };

  const getActivityLabel = (b: Booking) => {
    const sName = services[b.serviceId] || 'Service';
    switch (b.status) {
      case 'ACCEPTED': return `${sName} confirmed`;
      case 'PENDING': return `${sName} scheduled`;
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
      className="w-full max-w-7xl mx-auto space-y-8 pb-16"
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
        className="relative p-6 sm:p-8 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl transition-colors"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="shrink-0 relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="w-14 h-14 rounded-full p-[2px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors">
                <div className="w-full h-full rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-[var(--color-secondary-text)] group-hover:text-[var(--color-primary)] transition-colors" />
                  )}
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <h1 className="text-xl sm:text-2xl font-light text-[var(--color-primary-text)] tracking-wide">
                {getGreeting()}, <span className="font-medium text-[var(--color-primary)]">{user?.name?.split(' ')[0] || 'Client'}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 text-[var(--color-secondary-text)] font-sans text-[11px] uppercase tracking-wider mt-1">
                <CalendarDays size={12} className="text-[var(--color-primary)]" />
                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                {nextAppointment && (
                  <>
                    <span>•</span>
                    <span className="text-[var(--color-primary)] font-medium">Next appointment {nextAppointmentCountdown}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/booking')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,195,120,0.25)] cursor-pointer"
            >
              <CalendarDays size={14} />
              Book Appointment
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] border border-[var(--color-border)] rounded-xl transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          2. STAT CARDS (4-column grid)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Next Appointment"
          value={nextAppointment ? format(parseISO(nextAppointment.bookingDate), 'MMM d') : '—'}
          subtext={nextAppointment ? `${nextAppointment.startTime} · ${services[nextAppointment.serviceId] || 'Service'}` : 'None scheduled'}
          icon={<CalendarDays size={16} />}
          accent={!!nextAppointment}
          pathData={spark1}
        />
        <StatCard
          label="Total Visits"
          value={completedCount}
          subtext={`${completedCount} completed sessions`}
          icon={<TrendingUp size={16} />}
          pathData={spark2}
        />
        <StatCard
          label="Active Bookings"
          value={activeCount}
          subtext={activeCount > 0 ? 'Confirmed appointments' : 'No active bookings'}
          icon={<Zap size={16} />}
          accent={activeCount > 0}
          pathData={spark3}
        />
        <StatCard
          label="Membership"
          value={memberSince}
          subtext="Verified client"
          icon={<Star size={16} />}
          pathData={spark4}
        />
      </motion.div>

      {/* ════════════════════════════════════════
          3. TODAY'S SCHEDULE + SHOP INFO (2-col)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-7 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between shadow-md transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-[var(--color-primary)]" />
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-primary-text)] font-semibold">Today's Schedule</h3>
              </div>
              <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                {format(new Date(), 'MMM d')}
              </span>
            </div>

            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center mb-3">
                  <CalendarDays size={20} className="text-[var(--color-secondary-text)]" />
                </div>
                <p className="text-sm text-[var(--color-secondary-text)] font-sans mb-1">No appointments scheduled for today</p>
                <p className="font-sans text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">Your schedule is clear</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-[var(--color-primary-text)]">{services[b.serviceId] || 'Service'}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-2 font-sans text-xs text-[var(--color-secondary-text)]">
                        <Clock size={12} className="text-[var(--color-primary)]" />
                        <span>{b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}</span>
                      </div>
                    </div>
                    {(b.status === 'ACCEPTED' || b.status === 'PENDING') && (
                      <div>
                        {confirmingCancel === b.id ? (
                          <div className="flex items-center gap-2 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] px-1">Cancel?</span>
                            <button onClick={() => handleCancel(b.id)} className="px-3 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Yes</button>
                            <button onClick={() => setConfirmingCancel(null)} className="px-2 py-1 text-[var(--color-secondary-text)] text-[10px] uppercase tracking-wider hover:text-[var(--color-primary-text)] cursor-pointer">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingCancel(b.id)}
                            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider hover:border-red-500/40 hover:text-red-500 transition-colors cursor-pointer"
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
        <div className="lg:col-span-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between shadow-md transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-[var(--color-primary)]" />
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-primary-text)] font-semibold">Salon Hours</h3>
              </div>
              {isShopOpen !== null && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-sans font-medium ${
                  isShopOpen ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/30' : 'text-red-500 bg-red-500/10 border border-red-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isShopOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isShopOpen ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[11px]">Opening Hours</span>
                <span className="text-[var(--color-primary-text)] font-medium">{shopSettings.openingTime || '09:00'} – {shopSettings.closingTime || '18:00'}</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--color-border)]" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[11px]">Slot Interval</span>
                <span className="text-[var(--color-primary-text)] font-medium">{shopSettings.slotDurationMinutes || 30} minutes</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--color-border)]" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--color-secondary-text)] uppercase tracking-wider text-[11px]">Location</span>
                <span className="text-[var(--color-primary-text)] font-medium">Aurelian Salon & Spa</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/booking')}
            className="mt-6 w-full py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-raised)] text-[var(--color-primary)] font-sans text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
          >
            Check Available Slots →
          </button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          4. UPCOMING APPOINTMENTS (Card Grid)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={16} className="text-[var(--color-primary)]" />
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-primary-text)] font-semibold">Upcoming Appointments</h2>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 sm:p-12 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl text-center space-y-4 shadow-md transition-colors">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] mx-auto flex items-center justify-center">
              <CalendarDays size={20} className="text-[var(--color-secondary-text)]" />
            </div>
            <div>
              <h3 className="text-base text-[var(--color-primary-text)] font-medium mb-1">No upcoming appointments</h3>
              <p className="font-sans text-xs text-[var(--color-secondary-text)]">Select a service and reserve your preferred time slot.</p>
            </div>
            <button
              onClick={() => navigate('/booking')}
              className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Book Appointment</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((b, idx) => (
              <div
                key={b.id}
                className="relative overflow-hidden p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 rounded-2xl transition-all space-y-4 shadow-sm"
              >
                {idx === 0 && <BorderBeam size={140} duration={9} colorFrom="var(--color-primary)" borderWidth={1.5} />}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-medium text-[var(--color-primary-text)] mb-1.5">{services[b.serviceId] || 'Service'}</h4>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--color-primary)] font-sans">{format(parseISO(b.bookingDate), 'MMM d, yyyy')}</div>
                    <div className="font-sans text-[11px] text-[var(--color-secondary-text)] uppercase tracking-wider">{format(parseISO(b.bookingDate), 'EEEE')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-sans text-xs text-[var(--color-secondary-text)]">
                  <Clock size={13} className="text-[var(--color-primary)]" />
                  <span>{b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}</span>
                </div>

                {(b.status === 'ACCEPTED' || b.status === 'PENDING') && (
                  <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                    {confirmingCancel === b.id ? (
                      <div className="flex items-center gap-2 bg-[var(--color-surface-raised)] p-1.5 rounded-lg border border-[var(--color-border)]">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-secondary-text)] px-2">Cancel booking?</span>
                        <button onClick={() => handleCancel(b.id)} className="px-3 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Yes</button>
                        <button onClick={() => setConfirmingCancel(null)} className="px-2 py-1 text-[var(--color-secondary-text)] text-[10px] uppercase tracking-wider hover:text-[var(--color-primary-text)] cursor-pointer">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingCancel(b.id)}
                        className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-secondary-text)] font-sans text-[10px] uppercase tracking-wider hover:border-red-500/40 hover:text-red-500 transition-colors cursor-pointer"
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
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2.5">
            <History size={16} className="text-[var(--color-primary)]" />
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-[var(--color-primary-text)] font-semibold">Recent Activity</h2>
          </div>

          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-md transition-colors">
            <div className="space-y-4">
              {recentActivity.map((b) => (
                <div key={b.id} className="flex items-start gap-3.5 pb-3 border-b border-[var(--color-border)] last:border-b-0 last:pb-0">
                  <div className="mt-0.5">{getActivityIcon(b.status)}</div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs text-[var(--color-primary-text)] font-medium">{getActivityLabel(b)}</span>
                      <span className="text-[11px] text-[var(--color-secondary-text)] block font-sans">
                        {format(parseISO(b.bookingDate), 'MMM d, yyyy')} at {b.startTime}
                      </span>
                    </div>
                    <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--color-muted-text)] shrink-0">
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
                            {format(parseISO(b.bookingDate), 'MMM d, yyyy')} · {b.startTime}
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

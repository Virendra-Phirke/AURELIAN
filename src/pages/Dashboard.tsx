import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, formatDistanceToNow, differenceInMinutes, isToday, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays, Clock, User, History, Settings, Camera,
  ArrowRight, Phone, Sparkles, TrendingUp, ChevronDown, ChevronUp,
  Zap, Timer, MapPin, CheckCircle, XCircle, AlertCircle, Star
} from 'lucide-react';
import { authClient } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

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
  animate: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// --- Helper: Time Greeting ---
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// --- StatusBadge ---
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'text-[#C5A059] border-[#C5A059]/50 bg-[#C5A059]/10',
    ACCEPTED: 'text-[#4ade80] border-[#4ade80]/50 bg-[#4ade80]/10',
    REJECTED: 'text-red-400 border-red-400/50 bg-red-400/10',
    CANCELLED: 'text-[#555] border-[#555] bg-[#ffffff05]',
    COMPLETED: 'text-[#D4D4D4] border-[#ffffff30] bg-[#ffffff05]',
  };
  const isPulse = status === 'PENDING' || status === 'ACCEPTED';
  const dotColor = status === 'PENDING' ? 'bg-[#C5A059]' : status === 'ACCEPTED' ? 'bg-[#4ade80]' : '';

  return (
    <span className={`border rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] font-sans inline-flex items-center gap-2 ${colors[status] || colors.PENDING}`}>
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

// --- Toast ---
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl border ${type === 'error' ? 'bg-[#2a0808] border-red-500/30 text-red-400' : 'bg-[#111] border-[#C5A059]/30 text-[#C5A059]'} font-sans text-xs uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.8)]`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'error' ? 'bg-red-500' : 'bg-[#C5A059]'}`} />
        {message}
      </div>
    </motion.div>
  );
}

// --- Sparkline Mini Card ---
function StatCard({ label, value, subtext, icon, accent = false, pathData }: {
  label: string; value: string | number; subtext?: string; icon: React.ReactNode; accent?: boolean; pathData: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(197,160,89,0.08)' }}
      className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#ffffff12] p-5 sm:p-6 flex flex-col justify-between min-h-[140px] transition-all group"
    >
      <div className="flex items-center gap-2 text-[#777] z-10">
        {icon}
        <span className="font-sans text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="z-10 mt-3">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`text-3xl sm:text-4xl font-light block ${accent ? 'text-[#C5A059]' : 'text-white'}`}
        >
          {value}
        </motion.span>
        {subtext && (
          <span className="font-sans text-[9px] uppercase tracking-widest text-[#555] mt-1 block">{subtext}</span>
        )}
      </div>

      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-14 opacity-30 group-hover:opacity-70 transition-opacity duration-500">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`sg-${label.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={`${pathData} L100,40 L0,40 Z`}
            fill={`url(#sg-${label.replace(/\s+/g, '')})`}
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
          />
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
      setToast({ message: 'Booking cancelled', type: 'success' });
    } else {
      setToast({ message: 'Failed to cancel booking', type: 'error' });
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
    : 'N/A';

  // Recent activity (last 5 bookings by creation date)
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
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // --- Activity status icon ---
  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle size={14} className="text-[#4ade80]" />;
      case 'CANCELLED': return <XCircle size={14} className="text-[#555]" />;
      case 'REJECTED': return <XCircle size={14} className="text-red-400" />;
      case 'ACCEPTED': return <CheckCircle size={14} className="text-[#4ade80]" />;
      case 'PENDING': return <AlertCircle size={14} className="text-[#C5A059]" />;
      default: return <Clock size={14} className="text-[#555]" />;
    }
  };

  const getActivityLabel = (b: Booking) => {
    const sName = services[b.serviceId] || 'Service';
    switch (b.status) {
      case 'PENDING': return `Booked ${sName} — awaiting confirmation`;
      case 'ACCEPTED': return `${sName} confirmed`;
      case 'COMPLETED': return `${sName} completed`;
      case 'CANCELLED': return `${sName} cancelled`;
      case 'REJECTED': return `${sName} was declined`;
      default: return `${sName}`;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full space-y-8"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          1. WELCOME BANNER
         ════════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="relative p-8 sm:p-10 bg-[#0a0a0a] border border-[#ffffff12] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C5A059]/15 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#C5A059]/8 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="shrink-0 relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-b from-[#C5A059] to-[#C5A059]/20">
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[#888] group-hover:text-[#C5A059] transition-colors" />
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} className="text-white" />
              </div>
            </div>

            {/* Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-1">
                {getGreeting()}, <span className="font-medium italic text-[#C5A059]">{user?.name?.split(' ')[0] || 'Guest'}</span>
              </h1>
              <div className="flex items-center gap-3 text-[#666] font-sans text-[10px] uppercase tracking-widest">
                <CalendarDays size={12} className="text-[#C5A059]" />
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                {nextAppointment && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#444]" />
                    <span className="text-[#C5A059]">Next: {nextAppointmentCountdown}</span>
                  </>
                )}
              </div>
            </div>
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
          icon={<CalendarDays size={14} />}
          accent={!!nextAppointment}
          pathData={spark1}
        />
        <StatCard
          label="Total Visits"
          value={completedCount}
          subtext={completedCount === 1 ? '1 completed session' : `${completedCount} completed sessions`}
          icon={<TrendingUp size={14} />}
          pathData={spark2}
        />
        <StatCard
          label="Active Bookings"
          value={activeCount}
          subtext={activeCount > 0 ? 'Pending or confirmed' : 'No active bookings'}
          icon={<Zap size={14} />}
          accent={activeCount > 0}
          pathData={spark3}
        />
        <StatCard
          label="Member Since"
          value={memberSince}
          subtext="Valued client"
          icon={<Star size={14} />}
          pathData={spark4}
        />
      </motion.div>

      {/* ════════════════════════════════════════
          3. QUICK ACTIONS BAR
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.button
          whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(197,160,89,0.15)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/booking')}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-[#C5A059] text-black rounded-2xl font-sans text-[10px] uppercase tracking-widest hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)]"
        >
          <CalendarDays size={16} />
          Book Appointment
          <ArrowRight size={14} />
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-[#0a0a0a] border border-[#ffffff12] text-[#888] rounded-2xl font-sans text-[10px] uppercase tracking-widest hover:text-white hover:border-[#ffffff30] transition-all"
        >
          <Settings size={16} />
          Account Settings
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setToast({ message: 'Contact: info@aurelian.com', type: 'success' })}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-[#0a0a0a] border border-[#ffffff12] text-[#888] rounded-2xl font-sans text-[10px] uppercase tracking-widest hover:text-white hover:border-[#ffffff30] transition-all"
        >
          <Phone size={16} />
          Contact Us
        </motion.button>
      </motion.div>

      {/* ════════════════════════════════════════
          4. TODAY'S APPOINTMENT + SHOP INFO (2-col)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Today's Schedule */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/20 to-transparent" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
              <Sparkles size={14} className="text-[#C5A059]" />
            </div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#888]">Today's Schedule</h3>
            <span className="ml-auto font-sans text-[9px] uppercase tracking-widest text-[#555]">
              {format(new Date(), 'MMM d')}
            </span>
          </div>

          {todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-full bg-[#111] border border-[#ffffff10] flex items-center justify-center mb-4"
              >
                <CalendarDays size={22} className="text-[#555]" />
              </motion.div>
              <p className="text-lg font-light text-[#555] italic mb-1">No appointments today</p>
              <p className="font-sans text-[9px] uppercase tracking-widest text-[#444]">Enjoy your free day!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map((b) => {
                // Parse time for countdown
                let countdown = '';
                try {
                  const [h, m] = b.startTime.split(':').map(Number);
                  const aptTime = new Date();
                  aptTime.setHours(h, m, 0, 0);
                  if (isFuture(aptTime)) {
                    const mins = differenceInMinutes(aptTime, new Date());
                    const hrs = Math.floor(mins / 60);
                    const remMins = mins % 60;
                    countdown = hrs > 0 ? `Starts in ${hrs}h ${remMins}m` : `Starts in ${remMins}m`;
                  } else {
                    countdown = 'In progress';
                  }
                } catch { /* ignore */ }

                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ x: 3 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#111] border border-[#ffffff10] hover:border-[#C5A059]/30 transition-all group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-light text-white">{services[b.serviceId] || 'Service'}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-3 font-sans text-[10px] uppercase tracking-widest text-[#666]">
                        <Clock size={12} className="text-[#C5A059]" />
                        <span>{b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}</span>
                        {countdown && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#444]" />
                            <span className="text-[#C5A059]">
                              <Timer size={10} className="inline mr-1 -mt-0.5" />
                              {countdown}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {b.status === 'PENDING' && (
                      <div className="shrink-0">
                        {confirmingCancel === b.id ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 bg-[#0a0a0a] p-1.5 rounded-xl border border-[#ffffff15]"
                          >
                            <span className="text-[9px] uppercase tracking-widest text-[#888] px-2">Cancel?</span>
                            <button onClick={() => handleCancel(b.id)} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Yes</button>
                            <button onClick={() => setConfirmingCancel(null)} className="px-4 py-2 rounded-lg text-[#888] text-[9px] uppercase tracking-widest hover:text-white transition-colors">No</button>
                          </motion.div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfirmingCancel(b.id)}
                            className="px-5 py-2.5 border border-[#ffffff15] rounded-xl text-[#888] font-sans text-[9px] uppercase tracking-widest hover:border-red-500/30 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shop Info Widget */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/10 flex items-center justify-center">
              <MapPin size={14} className="text-[#C5A059]" />
            </div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#888]">Shop Info</h3>
          </div>

          <div className="space-y-5 flex-1">
            {/* Open / Closed Badge */}
            {isShopOpen !== null && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] uppercase tracking-widest font-sans ${isShopOpen
                  ? 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10'
                  : 'text-red-400 border-red-400/30 bg-red-400/10'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isShopOpen ? 'bg-[#4ade80] animate-pulse' : 'bg-red-400'}`} />
                {isShopOpen ? 'Open Now' : 'Closed'}
              </div>
            )}

            {/* Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#555]">Opens</span>
                <span className="text-white font-light text-sm">
                  {shopSettings.openingTime || '—'}
                </span>
              </div>
              <div className="w-full h-[1px] bg-[#ffffff08]" />
              <div className="flex items-center justify-between">
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#555]">Closes</span>
                <span className="text-white font-light text-sm">
                  {shopSettings.closingTime || '—'}
                </span>
              </div>
              <div className="w-full h-[1px] bg-[#ffffff08]" />
              <div className="flex items-center justify-between">
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#555]">Slot Duration</span>
                <span className="text-white font-light text-sm">
                  {shopSettings.slotDurationMinutes ? `${shopSettings.slotDurationMinutes} min` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Book CTA in shop info */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/booking')}
            className="mt-6 w-full py-3.5 rounded-xl border border-[#C5A059]/30 text-[#C5A059] font-sans text-[9px] uppercase tracking-widest hover:bg-[#C5A059]/10 transition-all"
          >
            Book a Slot
          </motion.button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          5. UPCOMING APPOINTMENTS (Card Grid)
         ════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays size={14} className="text-[#C5A059]" />
          <h2 className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#888]">Upcoming Appointments</h2>
          <span className="ml-auto font-sans text-[9px] uppercase tracking-widest text-[#555]">{upcoming.length} total</span>
        </div>

        {upcoming.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 sm:p-16 bg-[#0a0a0a] border border-[#ffffff12] flex flex-col items-center justify-center text-center rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/20 to-transparent" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(197,160,89,0.1)]"
            >
              <CalendarDays size={24} className="text-[#C5A059]" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-light text-white italic mb-2">Your Schedule is Clear</h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#555] mb-8">No upcoming appointments booked.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/booking')}
              className="px-8 py-4 bg-[#C5A059] text-black font-sans text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)]"
            >
              Book Appointment
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((b, i) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, borderColor: 'rgba(197,160,89,0.3)' }}
                key={b.id}
                className="p-6 bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] group relative overflow-hidden"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C5A059]/0 via-[#C5A059]/30 to-[#C5A059]/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-light text-white mb-1">{services[b.serviceId] || 'Service'}</h4>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-light text-[#C5A059]">{format(parseISO(b.bookingDate), 'MMM d')}</div>
                    <div className="font-sans text-[10px] text-[#666] tracking-wider">{format(parseISO(b.bookingDate), 'EEEE')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[#666] font-sans text-[10px] uppercase tracking-widest mb-5">
                  <Clock size={12} className="text-[#C5A059]" />
                  {b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}
                </div>

                {/* Actions */}
                {b.status === 'PENDING' && (
                  <div className="pt-4 border-t border-[#ffffff08]">
                    {confirmingCancel === b.id ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[9px] uppercase tracking-widest text-[#888]">Cancel this booking?</span>
                        <button onClick={() => handleCancel(b.id)} className="ml-auto px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Yes</button>
                        <button onClick={() => setConfirmingCancel(null)} className="px-4 py-2 rounded-lg text-[#888] text-[9px] uppercase tracking-widest hover:text-white transition-colors">No</button>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setConfirmingCancel(b.id)}
                        className="w-full py-2.5 border border-[#ffffff12] rounded-xl text-[#666] font-sans text-[9px] uppercase tracking-widest hover:border-red-500/30 hover:text-red-400 transition-all"
                      >
                        Cancel Booking
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════
          6. ACTIVITY TIMELINE
         ════════════════════════════════════════ */}
      {recentActivity.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6">
            <History size={14} className="text-[#C5A059]" />
            <h2 className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#888]">Recent Activity</h2>
          </div>

          <div className="bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl p-6 sm:p-8">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-[#C5A059]/30 via-[#ffffff10] to-transparent" />

              <div className="space-y-6">
                {recentActivity.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 pl-6 relative"
                  >
                    {/* Dot */}
                    <div className="absolute left-0 top-1 z-10">
                      {getActivityIcon(b.status)}
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-[#D4D4D4] font-light">{getActivityLabel(b)}</p>
                        <p className="font-sans text-[9px] uppercase tracking-widest text-[#555] mt-0.5">
                          {format(parseISO(b.bookingDate), 'MMM d, yyyy')} · {b.startTime}
                        </p>
                      </div>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-[#444] shrink-0">
                        {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════
          7. PAST HISTORY (Collapsible)
         ════════════════════════════════════════ */}
      {past.length > 0 && (
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            onClick={() => setShowPastHistory(!showPastHistory)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <History size={14} className="text-[#C5A059]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#888]">
                Past History
              </span>
              <span className="font-sans text-[9px] uppercase tracking-widest text-[#555] bg-[#ffffff08] px-2.5 py-1 rounded-full">
                {past.length}
              </span>
            </div>
            <motion.div
              animate={{ rotate: showPastHistory ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={16} className="text-[#555]" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showPastHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-[#0a0a0a] border border-[#ffffff12] rounded-2xl overflow-hidden">
                  <div className="divide-y divide-[#ffffff08]">
                    {past.map((b, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        key={b.id}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#ffffff03] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#111] border border-[#ffffff08] flex items-center justify-center shrink-0">
                            {getActivityIcon(b.status)}
                          </div>
                          <div>
                            <div className="text-sm font-light text-[#D4D4D4]">{services[b.serviceId] || 'Service'}</div>
                            <div className="font-sans text-[9px] text-[#555] uppercase tracking-widest">
                              {format(parseISO(b.bookingDate), 'MMM d, yyyy')} · {b.startTime}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={b.status} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

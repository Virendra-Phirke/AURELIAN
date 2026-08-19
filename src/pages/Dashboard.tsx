import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, User, AlertCircle, History, Settings, Camera } from 'lucide-react';
import { authClient } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

type Booking = {
  id: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  status: string;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'text-[#C5A059] border-[#C5A059]/50 bg-[#C5A059]/10',
    ACCEPTED: 'text-[#4ade80] border-[#4ade80]/50 bg-[#4ade80]/10',
    REJECTED: 'text-red-400 border-red-400/50 bg-red-400/10',
    CANCELLED: 'text-[#555] border-[#555] bg-[#ffffff05]',
    COMPLETED: 'text-[#D4D4D4] border-[#ffffff30] bg-[#ffffff05]'
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

// Toast for feedback
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: sessionData, isPending } = authClient.useSession();
  const user = (sessionData as any)?.user;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/services').then(r => r.json())
    ]).then(([bData, sData]) => {
      setBookings(Array.isArray(bData) ? bData : []);
      const sMap: Record<string, string> = {};
      sData.forEach((s: any) => { sMap[s.id] = s.name; });
      setServices(sMap);
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

  const upcoming = bookings.filter(b => b.status === 'PENDING' || b.status === 'ACCEPTED');
  const past = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED');

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

  return (
    <div className="w-full space-y-12 relative">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative p-8 sm:p-12 bg-[#0a0a0a] border border-[#ffffff15] rounded-3xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C5A059]/20 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        {/* Settings button */}
        <button 
          onClick={() => navigate('/settings')}
          className="absolute top-6 right-6 p-2 rounded-full bg-black/40 border border-[#ffffff15] text-[#888] hover:text-[#C5A059] hover:border-[#C5A059]/50 transition-all z-20 group"
        >
          <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
        </button>

        <div className="relative z-10 flex items-center gap-6 mt-4 sm:mt-0">
          <div className="shrink-0 relative group cursor-pointer" onClick={() => navigate('/settings')}>
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#C5A059] object-cover shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#111] border-2 border-[#C5A059] flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-transform group-hover:scale-105">
                <User size={32} className="text-[#888] group-hover:text-[#C5A059] transition-colors" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-wide mb-2">
              Hello, <span className="font-medium italic">{user?.name?.split(' ')[0] || 'Guest'}</span>
            </h1>
            <p className="text-[#888] font-sans text-xs uppercase tracking-widest">Client Portal & Appointments</p>
          </div>
        </div>
        <div className="relative z-10 w-full sm:w-auto">
          <a href="/booking" className="block w-full sm:w-auto px-8 py-4 bg-[#C5A059] text-black font-sans text-[10px] uppercase tracking-widest text-center rounded-xl hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)] hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]">
            New Booking
          </a>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <div className="p-6 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="text-[#888] font-sans text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#C5A059]" /> Next Appointment
          </div>
          {upcoming.length > 0 ? (
            <div>
              <div className="text-2xl font-light text-white mb-1">{format(parseISO(upcoming[0].bookingDate), 'MMM d, yyyy')}</div>
              <div className="text-sm font-sans tracking-widest text-[#C5A059]">{upcoming[0].startTime}</div>
            </div>
          ) : (
            <div className="text-xl font-light text-[#555] italic">None scheduled</div>
          )}
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="text-[#888] font-sans text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <History size={14} className="text-[#C5A059]" /> Total Visits
          </div>
          <div className="text-3xl font-light text-white">{past.filter(b => b.status === 'COMPLETED').length}</div>
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl flex flex-col justify-between shadow-lg sm:hidden lg:flex">
          <div className="text-[#888] font-sans text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle size={14} className="text-[#C5A059]" /> Account Status
          </div>
          <div className="text-sm font-sans tracking-widest uppercase text-[#4ade80] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" /> Active
          </div>
        </div>
      </motion.div>

      {/* Upcoming */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#888] mb-6 flex items-center gap-3">
          <CalendarDays size={14} className="text-[#C5A059]" />
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-12 sm:p-16 bg-[#0a0a0a] border border-[#ffffff15] flex flex-col items-center justify-center text-center rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-20" />
            <motion.div 
              animate={{ y: [0, -8, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(197,160,89,0.1)]"
            >
              <CalendarDays size={24} className="text-[#C5A059]" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-light text-white italic mb-2">Your Schedule is Clear</h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#555] mb-8">No upcoming appointments booked.</p>
            <a href="/booking" className="px-8 py-4 bg-[#C5A059] text-black font-sans text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)] hover:shadow-[0_0_30px_rgba(197,160,89,0.3)]">
              Book Appointment
            </a>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 5 }}
                key={b.id} 
                className="p-6 sm:p-8 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors hover:border-[#ffffff30] group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xl sm:text-2xl font-light text-white">{services[b.serviceId] || 'Service'}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="font-sans text-[11px] text-[#888] uppercase tracking-widest flex items-center gap-3 flex-wrap">
                    <CalendarDays size={12} className="text-[#C5A059]" />
                    {format(parseISO(b.bookingDate), 'EEEE, MMMM d, yyyy')}
                    <span className="w-1 h-1 rounded-full bg-[#555]" />
                    <Clock size={12} className="text-[#C5A059]" />
                    {b.startTime}
                  </div>
                </div>
                {b.status === 'PENDING' && (
                  <div className="shrink-0">
                    {confirmingCancel === b.id ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 bg-[#111] p-1.5 rounded-xl border border-[#ffffff15]"
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
                        className="px-6 py-3 border border-[#ffffff15] rounded-xl text-[#888] font-sans text-[10px] uppercase tracking-widest hover:border-red-500/50 hover:text-red-400 transition-all"
                      >
                        Cancel
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Past History */}
      {past.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#888] mb-6 flex items-center gap-3">
            <History size={14} className="text-[#C5A059]" />
            Past History
          </h2>
          <div className="space-y-3">
            {past.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                key={b.id} 
                className="p-5 sm:p-6 bg-[#0a0a0a] border border-[#ffffff08] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity"
              >
                <div>
                  <div className="text-lg font-light text-[#D4D4D4] mb-1">{services[b.serviceId] || 'Service'}</div>
                  <div className="font-sans text-[10px] text-[#555] uppercase tracking-widest flex items-center gap-2">
                    {format(parseISO(b.bookingDate), 'MMM d, yyyy')}
                    <span className="w-1 h-1 rounded-full bg-[#333]" />
                    {b.startTime}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

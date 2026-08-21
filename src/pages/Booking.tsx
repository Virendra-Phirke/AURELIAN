import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  parse,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scissors,
  Sparkles,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  CalendarDays,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { BorderBeam } from '../components/magicui/border-beam';
import { ShimmerButton } from '../components/magicui/shimmer-button';
import { AnimatedGridPattern } from '../components/magicui/animated-grid-pattern';
import { WordRotate } from '../components/magicui/word-rotate';
import { AvatarCircles } from '../components/magicui/avatar-circles';
import { BlurFade } from '../components/magicui/blur-fade';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

// Fallback pricing & icon mapping based on service name
const SERVICE_META: Record<string, { price: number; icon: 'user' | 'scissors' | 'sparkles'; desc: string }> = {
  haircut: { price: 75, icon: 'user', desc: 'Precision styling, wash & hot towel finish' },
  shaving: { price: 50, icon: 'scissors', desc: 'Classic straight-razor shave with essential oils' },
  'zat ke bal': { price: 90, icon: 'sparkles', desc: 'Signature full grooming & luxury scalp treatment' },
};

function getServiceIcon(name: string) {
  const meta = SERVICE_META[name.toLowerCase()];
  const iconType = meta?.icon || (name.toLowerCase().includes('shav') ? 'scissors' : name.toLowerCase().includes('hair') ? 'user' : 'sparkles');
  if (iconType === 'scissors') return <Scissors size={22} className="text-[var(--color-primary)]" />;
  if (iconType === 'sparkles') return <Sparkles size={22} className="text-[var(--color-primary)]" />;
  return <User size={22} className="text-[var(--color-primary)]" />;
}

function getServicePrice(name: string, duration: number): number {
  const meta = SERVICE_META[name.toLowerCase()];
  if (meta) return meta.price;
  return duration >= 30 ? 75 : 50;
}

function getServiceDescription(name: string): string {
  const meta = SERVICE_META[name.toLowerCase()];
  if (meta) return meta.desc;
  return 'Premium salon service with dedicated stylist';
}

// Convert 24-hr time '10:00' to '10:00 AM'
function formatTime12(time24: string): string {
  try {
    const parsed = parse(time24, 'HH:mm', new Date());
    return format(parsed, 'h:mm a');
  } catch {
    return time24;
  }
}

export default function Booking() {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  // Month currently viewed in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch available services
  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
          setSelectedService(data[0]);
        } else {
          // Fallback defaults matching mockup if DB has no services
          const defaults: Service[] = [
            { id: '1', name: 'Haircut', durationMinutes: 30 },
            { id: '2', name: 'Shaving', durationMinutes: 20 },
            { id: '3', name: 'Zat Ke Bal', durationMinutes: 30 },
          ];
          setServices(defaults);
          setSelectedService(defaults[1]); // Default to Shaving like mockup
        }
      })
      .catch(() => {
        const defaults: Service[] = [
          { id: '1', name: 'Haircut', durationMinutes: 30 },
          { id: '2', name: 'Shaving', durationMinutes: 20 },
          { id: '3', name: 'Zat Ke Bal', durationMinutes: 30 },
        ];
        setServices(defaults);
        setSelectedService(defaults[1]);
      });
  }, []);

  // 2. Fetch availability when service or date changes
  const fetchAvailability = useCallback((isRefetch = false) => {
    if (!selectedService || !selectedDate) return;
    if (!isRefetch) setLoadingSlots(true);

    fetch(`/api/availability?date=${selectedDate}&service=${encodeURIComponent(selectedService.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSlots(data);
          // If current selectedTime is not in the new slots, clear it
          setSelectedTime((prev) => {
            if (prev && !data.includes(prev)) return null;
            if (!prev && data.length > 0 && !isRefetch) {
              return data.length > 1 ? data[1] : data[0];
            }
            return prev;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isRefetch) setLoadingSlots(false);
      });
  }, [selectedService, selectedDate]);

  useEffect(() => {
    fetchAvailability(false);

    // Live background polling every 15s to keep slots in sync
    const interval = setInterval(() => fetchAvailability(true), 15000);
    const onFocus = () => fetchAvailability(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAvailability]);

  // 3. Month calendar dates generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setBookingLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          note: '',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Booking failed');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Could not complete booking.');
      // Instantly refresh available slots from server and deselect conflicting slot
      fetchAvailability(true);
    } finally {
      setBookingLoading(false);
    }
  };

  // Formatted date string for header: "Friday, October 20th, 2024"
  const formattedSelectedDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="relative w-full max-w-7xl mx-auto space-y-8 pb-16">
      <AnimatedGridPattern className="opacity-15 pointer-events-none" numSquares={30} maxOpacity={0.2} />
      {/* ════════════════════════════════════════
          VERCEL-STYLE HEADER & BRAND
         ════════════════════════════════════════ */}
      <div className="space-y-6 border-b border-[var(--color-border)] pb-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-brand font-semibold text-[var(--color-primary)] tracking-[0.25em] uppercase">
                AURELIAN
              </h1>
              <span className="text-xs uppercase font-sans tracking-[0.25em] text-[var(--color-secondary-text)]">
                Salon & Grooming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-muted-text)] uppercase tracking-wider font-sans">Experience:</span>
              <WordRotate
                words={[
                  "Bespoke Hair Styling",
                  "Artisanal Hot Towel Shaves",
                  "VIP Grooming Suites",
                  "Master Precision Cuts"
                ]}
                className="text-sm font-serif text-[var(--color-primary)] font-normal tracking-wide italic"
              />
            </div>
          </div>

          {/* Social Proof & Instant confirmation badge */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <AvatarCircles
                numPeople={40}
                avatarUrls={[
                  { name: 'Marcus Sterling' },
                  { name: 'Alexander Wright' },
                  { name: 'Julian Hayes' },
                  { name: 'David Vance' },
                ]}
              />
              <div className="text-left font-sans text-[9px] uppercase tracking-wider text-[var(--color-secondary-text)]">
                <span className="text-[var(--color-primary-text)] font-medium block">VIP Experience</span>
                <span>Verified Clients</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[10px] uppercase font-sans tracking-widest text-[var(--color-secondary-text)] shrink-0 self-start sm:self-auto shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Instant Confirmation</span>
            </div>
          </div>
        </div>

        {/* TOP STEP PROGRESS INDICATORS */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          {/* Step 1 Bar */}
          <div className="space-y-1.5">
            <div className="h-[2px] w-full rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)] transition-all" />
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-sans uppercase tracking-wider">
              <span className="text-[var(--color-primary)] font-semibold truncate">01 Service</span>
              {selectedService && <Check size={11} className="text-[var(--color-primary)] shrink-0 hidden sm:inline" />}
            </div>
          </div>

          {/* Step 2 Bar */}
          <div className="space-y-1.5">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedDate ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[var(--color-surface-raised)]'
              }`}
            />
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-sans uppercase tracking-wider">
              <span className={`truncate ${selectedDate ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-secondary-text)]'}`}>
                02 Date
              </span>
              {selectedDate && <Check size={11} className="text-[var(--color-primary)] shrink-0 hidden sm:inline" />}
            </div>
          </div>

          {/* Step 3 Bar */}
          <div className="space-y-1.5">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedTime ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[var(--color-surface-raised)]'
              }`}
            />
            <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-sans uppercase tracking-wider">
              <span className={`truncate ${selectedTime ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-secondary-text)]'}`}>
                03 Slots
              </span>
              {selectedTime && <Check size={11} className="text-[var(--color-primary)] shrink-0 hidden sm:inline" />}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN BOOKING GRID
         ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: STEP 01 (SERVICES) + STEP 02 (CALENDAR) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-10">
          {/* ──────────────────────────────────────
              STEP 01: SELECT SERVICE
             ────────────────────────────────────── */}
          <div className="space-y-3.5 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 01: <span className="text-[var(--color-primary)] font-normal">Select Service</span>
              </h2>
              <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                {services.length} services available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {services.map((service, idx) => {
                const isSelected = selectedService?.id === service.id;
                const price = getServicePrice(service.name, service.durationMinutes);

                return (
                  <BlurFade key={service.id} delay={0.04 * idx} inView>
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedService(service)}
                      className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-5 flex sm:flex-col items-center sm:items-stretch justify-between gap-3 text-left sm:text-center transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/10 shadow-[0_0_25px_rgba(229,195,120,0.18)]'
                          : 'bg-[var(--color-card-bg)] hover:bg-[var(--color-surface-hover)] shadow-md'
                      }`}
                    >
                      {isSelected && (
                        <BorderBeam size={140} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />
                      )}

                      <div className="flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-full shrink-0 flex items-center justify-center sm:mx-auto sm:mb-3 bg-[var(--color-surface-raised)]">
                          {getServiceIcon(service.name)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 sm:text-center min-w-0">
                          <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 mb-0.5 sm:mb-1">
                            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-primary-text)] truncate">
                              {service.name}
                            </h3>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[9px] sm:text-[10px] text-[var(--color-secondary-text)] font-sans tracking-wider sm:my-1.5 shrink-0">
                              <span>{service.durationMinutes}m</span>
                              <span>•</span>
                              <span className="text-[var(--color-primary)] font-semibold">${price}</span>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans line-clamp-1 sm:line-clamp-2 leading-relaxed">
                            {getServiceDescription(service.name)}
                          </p>
                        </div>
                      </div>

                      {/* Select / Selected Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                        }}
                        className={`shrink-0 px-3.5 py-2 sm:w-full sm:py-2.5 rounded-xl font-sans text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-black shadow-md'
                            : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-text)]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </motion.div>
                  </BlurFade>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────
              STEP 02: CHOOSE DATE
             ────────────────────────────────────── */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg sm:text-2xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 02: <span className="text-[var(--color-primary)] font-normal">Choose Date</span>
              </h2>
              <div className="font-sans text-[11px] sm:text-xs tracking-wider">
                <span className="text-[var(--color-secondary-text)]">Selected: </span>
                <span className="text-[var(--color-primary)] font-semibold font-serif">{formattedSelectedDate}</span>
              </div>
            </div>

            {/* MONTH CALENDAR CONTAINER */}
            <div className="bg-[var(--color-card-bg)] rounded-2xl p-3.5 sm:p-6 shadow-xl transition-colors">
              {/* Calendar Month Navigation */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 sm:p-2 rounded-lg text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="font-sans text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-primary-text)]">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 sm:p-2 rounded-lg text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-text)] font-semibold">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isDayPast = isBefore(day, startOfDay(new Date()));
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;

                  if (!isCurrentMonth) {
                    return <div key={idx} className="py-3 text-xs opacity-0 pointer-events-none" />;
                  }

                  if (isDayPast) {
                    return (
                      <div
                        key={idx}
                        className="py-3 font-sans text-xs text-[var(--color-border)] opacity-40 cursor-not-allowed select-none rounded-lg"
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`py-3 rounded-xl font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-black font-bold shadow-[0_0_15px_rgba(229,195,120,0.4)]'
                          : 'text-[var(--color-body-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      {format(day, 'd')}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STEP 03 (AVAILABLE SLOTS + CONFIRMATION) */}
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between min-h-[560px] shadow-2xl sticky top-8 transition-colors">
            {selectedService && selectedDate && selectedTime && (
              <BorderBeam size={180} duration={10} colorFrom="var(--color-primary)" borderWidth={1.5} />
            )}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                  Step 03: <span className="text-[var(--color-primary)] font-normal">Available Slots</span>
                </h2>
                <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                  {slots.length} open
                </span>
              </div>

              {/* Summary of Active Choice */}
              {selectedService && (
                <div className="p-3.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[var(--color-primary-text)]">
                    <span>{selectedService.name}</span>
                    <span className="text-[var(--color-primary)] font-serif">${getServicePrice(selectedService.name, selectedService.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--color-secondary-text)] font-sans tracking-wide">
                    <span className="flex items-center gap-1"><Clock size={11} /> {selectedService.durationMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {format(parseISO(selectedDate), 'MMM d')}</span>
                  </div>
                </div>
              )}

              {/* Time Slots Grid */}
              {loadingSlots ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-ping" />
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                    Checking availability...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-16 text-center font-sans text-xs uppercase tracking-widest text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] p-4">
                  No slots available for this date.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {slots.map((timeStr) => {
                    const isSelected = selectedTime === timeStr;
                    const formatted = formatTime12(timeStr);

                    return (
                      <motion.button
                        key={timeStr}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setSelectedTime(timeStr)}
                        className={`py-3.5 px-2 rounded-xl font-sans text-xs uppercase tracking-wider font-semibold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-black shadow-[0_0_15px_rgba(229,195,120,0.35)]'
                            : 'bg-[var(--color-surface-raised)] text-[var(--color-body-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-text)]'
                        }`}
                      >
                        {formatted}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Action Area */}
            <div className="pt-6 mt-6 border-t border-[var(--color-border)] space-y-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-950/20 border border-red-500/30 text-red-500 font-sans text-[10px] uppercase tracking-wider text-center rounded-xl flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Booking Shimmer CTA */}
              <ShimmerButton
                type="button"
                onClick={handleBooking}
                disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading}
                className="w-full py-4 px-6 font-sans text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-40 disabled:pointer-events-none"
                shimmerColor="var(--color-primary)"
                background="var(--color-surface-raised)"
              >
                {bookingLoading ? (
                  <span className="text-[var(--color-primary-text)]">Reserving Appointment...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] font-bold">
                    <span>Confirm Booking</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </ShimmerButton>

              <div className="flex items-center justify-center gap-2 text-[9px] text-[var(--color-secondary-text)] font-sans uppercase tracking-widest text-center">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Instant Confirmation & Zero Delay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

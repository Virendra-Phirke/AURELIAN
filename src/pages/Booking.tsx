import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  parseISO,
  isSameMonth,
  isBefore,
  startOfDay,
  addDays,
  subDays,
  isToday,
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

function getServiceDescription(name: string) {
  const meta = SERVICE_META[name.toLowerCase()];
  return meta?.desc || 'Exclusive grooming tailored to your distinct style & silhouette';
}

function getServicePrice(name: string, duration: number) {
  const meta = SERVICE_META[name.toLowerCase()];
  if (meta) return meta.price;
  return duration >= 45 ? 90 : duration >= 30 ? 75 : 50;
}

function formatTime12(time24: string) {
  try {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
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
  // Week start date (defaults to today)
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => startOfDay(new Date()));

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

  // 3. 7-Day Week dates generation starting from weekStartDate (today)
  const calendarDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  }, [weekStartDate]);

  const handlePrevWeek = () => {
    setWeekStartDate((prev) => {
      const target = subDays(prev, 7);
      const today = startOfDay(new Date());
      return isBefore(target, today) ? today : target;
    });
  };

  const handleNextWeek = () => {
    setWeekStartDate((prev) => addDays(prev, 7));
  };

  const canGoPrevWeek = useMemo(() => {
    const today = startOfDay(new Date());
    return !isBefore(weekStartDate, addDays(today, 1));
  }, [weekStartDate]);

  const weekRangeLabel = useMemo(() => {
    if (calendarDays.length === 0) return '';
    const first = calendarDays[0];
    const last = calendarDays[calendarDays.length - 1];
    if (isSameMonth(first, last)) {
      return `${format(first, 'MMMM d')} – ${format(last, 'd, yyyy')}`;
    }
    return `${format(first, 'MMM d')} – ${format(last, 'MMM d, yyyy')}`;
  }, [calendarDays]);

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
      <div className="space-y-3 sm:space-y-6 pb-2 sm:pb-6 transition-colors">
        {/* Desktop Header */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-6">
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
            <div className="flex items-center gap-3">
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

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[10px] uppercase font-sans tracking-widest text-[var(--color-secondary-text)] shrink-0 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Instant Confirmation</span>
            </div>
          </div>
        </div>

        {/* Mobile Header (Sleek, Compact, No redundant logo) */}
        <div className="sm:hidden flex items-center justify-between gap-2 pb-1">
          <div>
            <h1 className="text-sm font-serif font-medium text-[var(--color-primary-text)]">Book Appointment</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-text)]">
              <span>Experience:</span>
              <WordRotate
                words={[
                  "Bespoke Styling",
                  "Hot Towel Shave",
                  "VIP Suites",
                  "Precision Cuts"
                ]}
                className="font-serif text-[var(--color-primary)] italic text-[11px]"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] text-[9px] font-sans tracking-wider text-[var(--color-secondary-text)] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Instant</span>
          </div>
        </div>

        {/* TOP STEP PROGRESS INDICATORS */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          {/* Step 1 Bar */}
          <div className="space-y-1">
            <div className="h-[2px] w-full rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)] transition-all" />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-sans uppercase tracking-wider font-semibold">
              <span className="text-[var(--color-primary)] truncate">1. Service</span>
              {selectedService && <Check size={11} className="text-[var(--color-primary)] shrink-0 hidden sm:inline" />}
            </div>
          </div>

          {/* Step 2 Bar */}
          <div className="space-y-1">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedDate ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[var(--color-surface-raised)]'
              }`}
            />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-sans uppercase tracking-wider font-semibold">
              <span className={`truncate ${selectedDate ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
                2. Date
              </span>
              {selectedDate && <Check size={11} className="text-[var(--color-primary)] shrink-0 hidden sm:inline" />}
            </div>
          </div>

          {/* Step 3 Bar */}
          <div className="space-y-1">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedTime ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[var(--color-surface-raised)]'
              }`}
            />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-sans uppercase tracking-wider font-semibold">
              <span className={`truncate ${selectedTime ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
                3. Slots
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
          <div className="space-y-3 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-2xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 01: <span className="text-[var(--color-primary)] font-normal">Select Service</span>
              </h2>
              <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                {services.length} services
              </span>
            </div>

            {/* List View on mobile, Grid on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {services.map((service, idx) => {
                const isSelected = selectedService?.id === service.id;
                const price = getServicePrice(service.name, service.durationMinutes);

                return (
                  <BlurFade key={service.id} delay={0.03 * idx} inView>
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedService(service)}
                      className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex sm:flex-col items-center sm:items-stretch justify-between gap-2.5 sm:gap-3 text-left sm:text-center transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/10 shadow-[0_0_20px_rgba(229,195,120,0.18)]'
                          : 'bg-[var(--color-card-bg)] hover:bg-[var(--color-surface-hover)] shadow-sm sm:shadow-md'
                      }`}
                    >
                      {isSelected && (
                        <BorderBeam size={100} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />
                      )}

                      <div className="flex sm:flex-col items-center sm:items-stretch gap-2.5 sm:gap-0 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-full shrink-0 flex items-center justify-center sm:mx-auto sm:mb-3 bg-[var(--color-surface-raised)]">
                          {getServiceIcon(service.name)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 sm:text-center min-w-0">
                          <div className="flex sm:flex-col items-center sm:justify-center gap-1.5 sm:gap-0 mb-0.5 sm:mb-1">
                            <h3 className="font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-primary-text)] truncate">
                              {service.name}
                            </h3>
                            <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[8px] sm:text-[10px] text-[var(--color-secondary-text)] font-sans tracking-wider sm:my-1.5 shrink-0">
                              <span>{service.durationMinutes}m</span>
                              <span>•</span>
                              <span className="text-[var(--color-primary)] font-semibold">${price}</span>
                            </div>
                          </div>
                          <p className="text-[9px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
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
                        className={`shrink-0 px-3 py-1.5 sm:w-full sm:py-2.5 rounded-lg sm:rounded-xl font-sans text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
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
          <div className="space-y-3 sm:space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base sm:text-2xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 02: <span className="text-[var(--color-primary)] font-normal">Choose Date</span>
              </h2>
              <div className="font-sans text-[10px] sm:text-xs tracking-wider">
                <span className="text-[var(--color-secondary-text)]">Selected: </span>
                <span className="text-[var(--color-primary)] font-semibold font-serif">{formattedSelectedDate}</span>
              </div>
            </div>

            {/* 7-DAY WEEK CALENDAR CONTAINER */}
            <div className="bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-md sm:shadow-xl transition-colors">
              {/* Week Navigation Header */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-4 pb-2 sm:pb-3 border-b border-[var(--color-surface-raised)]">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  disabled={!canGoPrevWeek}
                  className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                    canGoPrevWeek
                      ? 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)]'
                      : 'text-[var(--color-muted-text)] opacity-25 cursor-not-allowed'
                  }`}
                  aria-label="Previous week"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--color-primary-text)]">
                  {weekRangeLabel}
                </div>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1 sm:p-1.5 rounded-lg text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
                  aria-label="Next week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 7-Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center">
                {calendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  const isDayToday = isToday(day);

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative flex flex-col items-center justify-center py-2 sm:py-3.5 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-black font-bold shadow-[0_0_18px_rgba(229,195,120,0.45)]'
                          : 'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-body-text)] hover:text-[var(--color-primary-text)]'
                      }`}
                    >
                      <span className={`font-sans text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1 ${
                        isSelected ? 'text-black/80 font-bold' : 'text-[var(--color-secondary-text)] font-semibold'
                      }`}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-xs sm:text-base font-semibold ${
                        isSelected ? 'text-black font-bold' : 'text-[var(--color-primary-text)]'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {isDayToday && (
                        <span className={`w-1 h-1 rounded-full mt-1 ${
                          isSelected ? 'bg-black' : 'bg-[var(--color-primary)]'
                        }`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STEP 03 (AVAILABLE SLOTS + CONFIRMATION) */}
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden bg-[var(--color-card-bg)] rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col justify-between min-h-0 sm:min-h-[560px] shadow-lg sm:shadow-2xl sticky top-8 transition-colors">
            {selectedService && selectedDate && selectedTime && (
              <BorderBeam size={140} duration={10} colorFrom="var(--color-primary)" borderWidth={1.5} />
            )}
            <div className="space-y-3 sm:space-y-5">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[var(--color-surface-raised)]">
                <h2 className="text-base sm:text-xl font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                  Step 03: <span className="text-[var(--color-primary)] font-normal">Available Slots</span>
                </h2>
                <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                  {slots.length} open
                </span>
              </div>

              {/* Summary of Active Choice */}
              {selectedService && (
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[var(--color-surface-raised)] text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[var(--color-primary-text)]">
                    <span className="truncate">{selectedService.name}</span>
                    <span className="text-[var(--color-primary)] font-serif shrink-0">${getServicePrice(selectedService.name, selectedService.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-[var(--color-secondary-text)] font-sans tracking-wide">
                    <span className="flex items-center gap-1"><Clock size={11} /> {selectedService.durationMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {format(parseISO(selectedDate), 'MMM d')}</span>
                  </div>
                </div>
              )}

              {/* Time Slots Grid (3 columns on mobile chips, 2 on desktop) */}
              {loadingSlots ? (
                <div className="py-6 sm:py-20 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-ping" />
                  <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                    Checking availability...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-4 sm:py-16 text-center font-sans text-[11px] sm:text-xs uppercase tracking-widest text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] rounded-xl p-3 sm:p-4">
                  No slots available for this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
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
                        className={`py-2 sm:py-3.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-sans text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-all text-center cursor-pointer ${
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
            <div className="pt-3 sm:pt-6 mt-3 sm:mt-6 border-t border-[var(--color-surface-raised)] space-y-3 sm:space-y-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-2.5 bg-red-950/20 border border-red-500/30 text-red-500 font-sans text-[10px] uppercase tracking-wider text-center rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Booking Shimmer CTA */}
              <ShimmerButton
                type="button"
                onClick={handleBooking}
                disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] disabled:opacity-40 disabled:pointer-events-none"
                shimmerColor="var(--color-primary)"
                background="var(--color-surface-raised)"
              >
                {bookingLoading ? (
                  <span className="text-[var(--color-primary-text)]">Reserving...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] font-bold">
                    <span>Confirm Booking</span>
                    <ArrowRight size={13} />
                  </div>
                )}
              </ShimmerButton>

              <div className="flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] text-[var(--color-secondary-text)] font-sans uppercase tracking-widest text-center">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>Instant Confirmation & Zero Delay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

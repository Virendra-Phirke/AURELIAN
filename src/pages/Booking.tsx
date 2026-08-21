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
  Zap,
  Megaphone
} from 'lucide-react';
import { BorderBeam } from '../components/magicui/border-beam';
import { ShimmerButton } from '../components/magicui/shimmer-button';
import { AnimatedGridPattern } from '../components/magicui/animated-grid-pattern';
import { WordRotate } from '../components/magicui/word-rotate';
import { AvatarCircles } from '../components/magicui/avatar-circles';
import { BlurFade } from '../components/magicui/blur-fade';
import { AnimatedList } from '../components/magicui/animated-list';
import { ServiceCardSkeleton, TimeSlotSkeleton } from '../components/ui/skeleton';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number;
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

function getServicePrice(serviceOrName: any, duration?: number) {
  if (typeof serviceOrName === 'object' && serviceOrName) {
    if (serviceOrName.price !== undefined && serviceOrName.price !== null && typeof serviceOrName.price === 'number') return serviceOrName.price;
    return getServicePrice(serviceOrName.name, serviceOrName.durationMinutes);
  }
  const meta = SERVICE_META[String(serviceOrName).toLowerCase()];
  if (meta) return meta.price;
  return (duration || 30) >= 45 ? 90 : (duration || 30) >= 30 ? 75 : 50;
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
  const [shopSettings, setShopSettings] = useState<any>(null);

  // 1. Fetch available services & shop settings
  useEffect(() => {
    fetch('/api/shop')
      .then((r) => r.json())
      .then((data) => setShopSettings(data))
      .catch(() => {});
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
          if (data.length > 0) {
            setSelectedService(data[0]);
          }
        }
      })
      .catch(() => {
        setServices([]);
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
    <div className="relative w-full max-w-6xl mx-auto space-y-5 sm:space-y-6 pb-16">
      <AnimatedGridPattern className="opacity-15 pointer-events-none" numSquares={30} maxOpacity={0.2} />

      {/* Broadcast Announcement Banner */}
      {shopSettings?.announcementActive && shopSettings?.announcementText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center gap-2.5 shadow-sm"
        >
          <Megaphone size={16} className="shrink-0" />
          <span className="text-xs sm:text-sm font-sans font-medium tracking-wide">
            {shopSettings.announcementText}
          </span>
        </motion.div>
      )}

      {/* ════════════════════════════════════════
          VERCEL-STYLE HEADER & BRAND
         ════════════════════════════════════════ */}
      <div className="space-y-2.5 sm:space-y-4 pb-1 sm:pb-3 transition-colors">
        {/* Desktop Header */}
        <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-brand font-semibold text-[var(--color-primary)] tracking-[0.25em] uppercase">
                AURELIAN
              </h1>
              <span className="text-[10px] sm:text-xs uppercase font-sans tracking-[0.25em] text-[var(--color-secondary-text)]">
                Salon & Grooming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-[var(--color-muted-text)] uppercase tracking-wider font-sans">Experience:</span>
              <WordRotate
                words={[
                  "Bespoke Hair Styling",
                  "Artisanal Hot Towel Shaves",
                  "VIP Grooming Suites",
                  "Master Precision Cuts"
                ]}
                className="text-xs sm:text-sm font-serif text-[var(--color-primary)] font-normal tracking-wide italic"
              />
            </div>
          </div>

          {/* Social Proof & Instant confirmation badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <AvatarCircles
                numPeople={40}
                avatarUrls={[
                  { name: 'Marcus Sterling' },
                  { name: 'Alexander Wright' },
                  { name: 'Julian Hayes' },
                  { name: 'David Vance' },
                ]}
              />
              <div className="text-left font-sans text-[8.5px] uppercase tracking-wider text-[var(--color-secondary-text)]">
                <span className="text-[var(--color-primary-text)] font-medium block">VIP Experience</span>
                <span>Verified Clients</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[9px] uppercase font-sans tracking-wider text-[var(--color-secondary-text)] shrink-0 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
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
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {/* Step 1 Bar */}
          <div className="space-y-1">
            <div className="h-[2px] w-full rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(229,195,120,0.4)] transition-all" />
            <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] font-sans uppercase tracking-wider font-semibold">
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
            <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] font-sans uppercase tracking-wider font-semibold">
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
            <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] font-sans uppercase tracking-wider font-semibold">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN: STEP 01 (SERVICES) + STEP 02 (CALENDAR) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* ──────────────────────────────────────
              STEP 01: SELECT SERVICE
             ────────────────────────────────────── */}
          <div className="space-y-2.5 sm:space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-lg font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 01: <span className="text-[var(--color-primary)] font-normal italic">Select Service</span>
              </h2>
              <span className="font-sans text-[8.5px] sm:text-[9.5px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                {services.length} services
              </span>
            </div>

            {/* Animated List Container (Scrollable showing up to 3 items) */}
            <div className="max-h-[224px] sm:max-h-[238px] overflow-y-auto overflow-x-hidden pr-1 space-y-2 scrollbar-thin">
              {services.length === 0 ? (
                <div className="space-y-2">
                  <ServiceCardSkeleton />
                  <ServiceCardSkeleton />
                </div>
              ) : (
                <AnimatedList delay={150} reverse={false} className="gap-2 sm:gap-2.5">
                  {services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    const price = getServicePrice(service.name, service.durationMinutes);

                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`relative overflow-hidden rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all cursor-pointer select-none flex items-center justify-between gap-3 w-full ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-sm'
                          : 'bg-[var(--color-card-bg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <BorderBeam size={100} duration={8} colorFrom="var(--color-primary)" borderWidth={1.5} />
                      )}

                      {/* Left: Icon & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-surface-raised)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                          {getServiceIcon(service.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-text)] truncate">
                              {service.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[8.5px] sm:text-[9.5px] text-[var(--color-secondary-text)] font-sans tracking-wide shrink-0">
                              {service.durationMinutes}m
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] font-sans line-clamp-1 mt-0.5">
                            {getServiceDescription(service.name)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price & Action */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-serif text-sm sm:text-base font-bold text-[var(--color-primary)]">
                          {(shopSettings?.currencySymbol || '$')}{price}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-sans text-[9.5px] uppercase tracking-wider font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                              : 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-text)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </AnimatedList>
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────
              STEP 02: CHOOSE DATE
             ────────────────────────────────────── */}
          <div className="space-y-2.5 sm:space-y-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm sm:text-lg font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                Step 02: <span className="text-[var(--color-primary)] font-normal italic">Choose Date</span>
              </h2>
              <div className="font-sans text-[10px] sm:text-xs tracking-wider">
                <span className="text-[var(--color-secondary-text)]">Selected: </span>
                <span className="text-[var(--color-primary)] font-semibold font-serif">{formattedSelectedDate}</span>
              </div>
            </div>

            {/* 7-DAY WEEK CALENDAR CONTAINER */}
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm transition-colors">
              {/* Week Navigation Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--color-border)]">
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
                  <ChevronLeft size={15} />
                </button>
                <div className="font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--color-primary-text)]">
                  {weekRangeLabel}
                </div>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1 sm:p-1.5 rounded-lg text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
                  aria-label="Next week"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* 7-Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                {calendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  const isDayToday = isToday(day);

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                          : 'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-body-text)] hover:text-[var(--color-primary-text)] border border-[var(--color-border)]'
                      }`}
                    >
                      <span className={`font-sans text-[8px] sm:text-[9px] uppercase tracking-wider mb-0.5 ${
                        isSelected ? 'text-black font-bold' : 'text-[var(--color-secondary-text)] font-semibold'
                      }`}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold ${
                        isSelected ? 'text-black' : 'text-[var(--color-primary-text)]'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {isDayToday && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${
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
          <div className="relative overflow-hidden bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm sticky top-6 transition-colors">
            {selectedService && selectedDate && selectedTime && (
              <BorderBeam size={120} duration={10} colorFrom="var(--color-primary)" borderWidth={1.5} />
            )}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                <h2 className="text-sm sm:text-lg font-serif text-[var(--color-primary-text)] font-medium tracking-wide">
                  Step 03: <span className="text-[var(--color-primary)] font-normal italic">Available Slots</span>
                </h2>
                <span className="font-sans text-[8.5px] sm:text-[9.5px] uppercase tracking-widest text-[var(--color-secondary-text)]">
                  {slots.length} open
                </span>
              </div>

              {/* Summary of Active Choice */}
              {selectedService && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[var(--color-primary-text)]">
                    <span className="truncate">{selectedService.name}</span>
                    <span className="text-[var(--color-primary)] font-serif shrink-0">{(shopSettings?.currencySymbol || '$')}{getServicePrice(selectedService.name, selectedService.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-secondary-text)] font-sans tracking-wide">
                    <span className="flex items-center gap-1"><Clock size={11} /> {selectedService.durationMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {format(parseISO(selectedDate), 'MMM d')}</span>
                  </div>
                </div>
              )}

              {/* Time Slots Grid (3 columns on mobile chips, 2 on desktop) */}
              {loadingSlots ? (
                <TimeSlotSkeleton />
              ) : slots.length === 0 ? (
                <div className="py-4 sm:py-10 text-center font-sans text-[10px] sm:text-xs uppercase tracking-widest text-[var(--color-secondary-text)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-3">
                  No slots available for this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2">
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
                        className={`py-2 px-1.5 sm:px-2 rounded-lg sm:rounded-xl font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm'
                            : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-body-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-text)]'
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
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[var(--color-border)] space-y-2.5">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-2 bg-red-950/20 border border-red-500/30 text-red-500 font-sans text-[9.5px] uppercase tracking-wider text-center rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Booking Shimmer CTA */}
              <ShimmerButton
                type="button"
                onClick={handleBooking}
                disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading}
                className="w-full py-2.5 sm:py-3 px-4 font-sans text-[10.5px] sm:text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:pointer-events-none"
                shimmerColor="var(--color-primary)"
                background="var(--color-surface-raised)"
              >
                {bookingLoading ? (
                  <span className="text-[var(--color-primary-text)]">Reserving...</span>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-[var(--color-primary)] font-bold">
                    <span>Confirm Booking</span>
                    <ArrowRight size={13} />
                  </div>
                )}
              </ShimmerButton>

              <div className="flex items-center justify-center gap-1.5 text-[8px] sm:text-[8.5px] text-[var(--color-secondary-text)] font-sans uppercase tracking-widest text-center">
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

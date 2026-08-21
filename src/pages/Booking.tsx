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
  if (iconType === 'scissors') return <Scissors size={22} className="text-[#E5C378]" />;
  if (iconType === 'sparkles') return <Sparkles size={22} className="text-[#E5C378]" />;
  return <User size={22} className="text-[#E5C378]" />;
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
      <div className="space-y-6 border-b border-[#1a1a1a] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-brand font-semibold text-[#E5C378] tracking-[0.25em] uppercase">
                AURELIAN
              </h1>
              <span className="text-xs uppercase font-sans tracking-[0.25em] text-[#737373]">
                Salon & Grooming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#525252] uppercase tracking-wider font-sans">Experience:</span>
              <WordRotate
                words={[
                  "Bespoke Hair Styling",
                  "Artisanal Hot Towel Shaves",
                  "VIP Grooming Suites",
                  "Master Precision Cuts"
                ]}
                className="text-sm font-serif text-[#E5C378] font-normal tracking-wide italic"
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
              <div className="text-left font-sans text-[9px] uppercase tracking-wider text-[#737373]">
                <span className="text-white font-medium block">VIP Experience</span>
                <span>Verified Clients</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-[10px] uppercase font-sans tracking-widest text-[#a1a1a1] shrink-0 self-start sm:self-auto shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
              </span>
              <span>Instant Confirmation</span>
            </div>
          </div>
        </div>

        {/* TOP STEP PROGRESS INDICATORS (Geist Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Step 1 Bar */}
          <div className="space-y-2">
            <div className="h-[2px] w-full rounded-full bg-[#E5C378] shadow-[0_0_8px_rgba(229,195,120,0.4)] transition-all" />
            <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-[0.15em]">
              <span className="text-[#E5C378] font-medium">Step 01 (Select Service)</span>
              {selectedService && <Check size={12} className="text-[#E5C378]" />}
            </div>
          </div>

          {/* Step 2 Bar */}
          <div className="space-y-2">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedDate ? 'bg-[#E5C378] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[#222222]'
              }`}
            />
            <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-[0.15em]">
              <span className={selectedDate ? 'text-[#E5C378] font-medium' : 'text-[#666666]'}>
                Step 02 (Choose Date)
              </span>
              {selectedDate && <Check size={12} className="text-[#E5C378]" />}
            </div>
          </div>

          {/* Step 3 Bar */}
          <div className="space-y-2">
            <div
              className={`h-[2px] w-full rounded-full transition-all ${
                selectedTime ? 'bg-[#E5C378] shadow-[0_0_8px_rgba(229,195,120,0.4)]' : 'bg-[#222222]'
              }`}
            />
            <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-[0.15em]">
              <span className={selectedTime ? 'text-[#E5C378] font-medium' : 'text-[#666666]'}>
                Step 03 (Available Slots)
              </span>
              {selectedTime && <Check size={12} className="text-[#E5C378]" />}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN BOOKING GRID
         ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: STEP 01 (SERVICES) + STEP 02 (CALENDAR) */}
        <div className="lg:col-span-8 space-y-10">
          {/* ──────────────────────────────────────
              STEP 01: SELECT SERVICE
             ────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-serif text-[#E5C378] font-normal tracking-wide">
                Step 01: Select Service
              </h2>
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#737373]">
                {services.length} services available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {services.map((service, idx) => {
                const isSelected = selectedService?.id === service.id;
                const price = getServicePrice(service.name, service.durationMinutes);

                return (
                  <BlurFade key={service.id} delay={0.04 * idx} inView>
                    <motion.div
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedService(service)}
                      className={`relative overflow-hidden rounded-xl p-5 flex flex-col justify-between text-center transition-all cursor-pointer min-h-[220px] select-none ${
                        isSelected
                          ? 'bg-[#0e0d09] border border-[#E5C378] shadow-[0_0_25px_rgba(229,195,120,0.12)] ring-1 ring-[#E5C378]/30'
                          : 'bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#383838]'
                      }`}
                    >
                      {isSelected && (
                        <BorderBeam size={90} duration={8} colorFrom="#E5C378" borderWidth={1.5} />
                      )}

                      {/* Top Icon and Name */}
                      <div>
                        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3.5 bg-[#141414] border border-[#222222]">
                          {getServiceIcon(service.name)}
                        </div>

                        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white mb-1.5">
                          {service.name}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#262626] text-[10px] text-[#a1a1a1] font-sans tracking-wider mb-3">
                          <span>{service.durationMinutes} min</span>
                          <span>•</span>
                          <span className="text-[#E5C378] font-medium">${price}</span>
                        </div>
                        <p className="text-[11px] text-[#666666] font-sans line-clamp-2 leading-relaxed px-1">
                          {getServiceDescription(service.name)}
                        </p>
                      </div>

                      {/* Select / Selected Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                        }}
                        className={`w-full py-2.5 rounded-lg font-sans text-[10px] uppercase tracking-widest font-semibold transition-all mt-4 ${
                          isSelected
                            ? 'bg-[#E5C378] text-black shadow-[0_0_12px_rgba(229,195,120,0.3)]'
                            : 'bg-[#141414] text-[#888888] hover:bg-[#202020] hover:text-white border border-[#222222]'
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
          <div className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-serif text-[#E5C378] font-normal tracking-wide">
                Step 02: Choose Date
              </h2>
              <div className="font-sans text-xs tracking-wider">
                <span className="text-[#737373]">Selected: </span>
                <span className="text-[#E5C378] font-medium font-serif">{formattedSelectedDate}</span>
              </div>
            </div>

            {/* MONTH CALENDAR CONTAINER (Geist Style) */}
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 shadow-xl">
              {/* Calendar Month Navigation */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#171717]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#171717] transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#171717] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-[#666666] font-medium">
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
                        className="py-3 font-sans text-xs text-[#2e2e2e] cursor-not-allowed select-none rounded-lg"
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
                      className={`py-3 rounded-lg font-sans text-xs font-medium transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#E5C378] text-black font-bold shadow-[0_0_15px_rgba(229,195,120,0.4)]'
                          : 'text-[#d4d4d4] hover:text-white hover:bg-[#171717]'
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
          <div className="relative overflow-hidden bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 flex flex-col justify-between min-h-[560px] shadow-2xl sticky top-8">
            {selectedService && selectedDate && selectedTime && (
              <BorderBeam size={180} duration={10} colorFrom="#E5C378" borderWidth={1.5} />
            )}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#171717]">
                <h2 className="text-xl font-serif text-[#E5C378] font-normal tracking-wide">
                  Step 03: Available Slots
                </h2>
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#737373]">
                  {slots.length} open
                </span>
              </div>

              {/* Summary of Active Choice */}
              {selectedService && (
                <div className="p-3.5 rounded-lg bg-[#111111] border border-[#1c1c1c] text-xs space-y-1">
                  <div className="flex items-center justify-between font-medium text-white">
                    <span>{selectedService.name}</span>
                    <span className="text-[#E5C378] font-serif">${getServicePrice(selectedService.name, selectedService.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#737373] font-sans tracking-wide">
                    <span className="flex items-center gap-1"><Clock size={11} /> {selectedService.durationMinutes} min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {format(parseISO(selectedDate), 'MMM d')}</span>
                  </div>
                </div>
              )}

              {/* Time Slots Grid */}
              {loadingSlots ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5C378] animate-ping" />
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#737373]">
                    Checking availability...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-16 text-center font-sans text-xs uppercase tracking-widest text-[#666666] bg-[#111111] rounded-lg border border-[#1a1a1a] p-4">
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
                        className={`py-3.5 px-2 rounded-lg font-sans text-xs uppercase tracking-wider font-semibold transition-all text-center ${
                          isSelected
                            ? 'bg-[#E5C378] text-black shadow-[0_0_15px_rgba(229,195,120,0.35)]'
                            : 'bg-[#111111] border border-[#222222] text-[#d4d4d4] hover:border-[#E5C378]/50 hover:bg-[#171717] hover:text-white'
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
            <div className="pt-6 mt-6 border-t border-[#171717] space-y-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 font-sans text-[10px] uppercase tracking-wider text-center rounded-lg flex items-center justify-center gap-2"
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
                className="w-full py-3.5 px-6 font-sans text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-40 disabled:pointer-events-none"
                shimmerColor="#E5C378"
                background="linear-gradient(135deg, #1f1a10 0%, #0d0d0d 100%)"
              >
                {bookingLoading ? (
                  <span>Reserving Appointment...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-[#E5C378]">
                    <span>Confirm Booking</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </ShimmerButton>

              <div className="flex items-center justify-center gap-2 text-[9px] text-[#666666] font-sans uppercase tracking-widest text-center">
                <ShieldCheck size={12} className="text-[#4ade80]" />
                <span>Instant Confirmation & Zero Delay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

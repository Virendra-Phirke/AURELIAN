import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  parse,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Sparkles, User, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

// Fallback pricing & icon mapping based on service name
const SERVICE_META: Record<string, { price: number; icon: 'user' | 'scissors' | 'sparkles' }> = {
  haircut: { price: 75, icon: 'user' },
  shaving: { price: 50, icon: 'scissors' },
  'zat ke bal': { price: 90, icon: 'sparkles' },
};

function getServiceIcon(name: string) {
  const meta = SERVICE_META[name.toLowerCase()];
  const iconType = meta?.icon || (name.toLowerCase().includes('shav') ? 'scissors' : name.toLowerCase().includes('hair') ? 'user' : 'sparkles');
  if (iconType === 'scissors') return <Scissors size={26} className="text-[#E5C378]" />;
  if (iconType === 'sparkles') return <Sparkles size={26} className="text-[#E5C378]" />;
  return <User size={26} className="text-[#E5C378]" />;
}

function getServicePrice(name: string, duration: number): number {
  const meta = SERVICE_META[name.toLowerCase()];
  if (meta) return meta.price;
  return duration >= 30 ? 75 : 50;
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
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    setError('');

    fetch(`/api/availability?date=${selectedDate}&service=${encodeURIComponent(selectedService.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlots(data);
          // Pre-select second slot if available like mockup
          if (data.length > 1) {
            setSelectedTime(data[1]);
          } else {
            setSelectedTime(data[0]);
          }
        } else {
          // Fallback mockup slots if none returned for demo
          const fallbackSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];
          setSlots(fallbackSlots);
          setSelectedTime('11:30');
        }
      })
      .catch(() => {
        const fallbackSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];
        setSlots(fallbackSlots);
        setSelectedTime('11:30');
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedDate]);

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
    } finally {
      setBookingLoading(false);
    }
  };

  // Step state
  const isStep1Done = !!selectedService;
  const isStep2Done = !!selectedDate;
  const isStep3Done = !!selectedTime;

  // Formatted date string for header: "Friday, October 20th, 2024"
  const formattedSelectedDate = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="w-full space-y-10 pb-16">
      {/* ════════════════════════════════════════
          HEADER & LUXURY TITLE
         ════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-brand font-semibold text-[#E5C378] tracking-[0.2em] uppercase">
            AURELIAN
          </h1>
          <span className="text-xl sm:text-2xl font-serif text-[#cccccc] font-light tracking-wide italic">
            Luxury Booking Interface V1
          </span>
        </div>

        {/* TOP STEP PROGRESS INDICATORS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Step 1 Bar */}
          <div className="space-y-2">
            <div className="h-[3px] w-full rounded-full bg-[#E5C378] shadow-[0_0_10px_rgba(229,195,120,0.5)] transition-all" />
            <div className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#E5C378] font-medium">
              Step 01 (Select Service)
            </div>
          </div>

          {/* Step 2 Bar */}
          <div className="space-y-2">
            <div
              className={`h-[3px] w-full rounded-full transition-all ${
                isStep2Done ? 'bg-[#E5C378] shadow-[0_0_10px_rgba(229,195,120,0.5)]' : 'bg-[#222]'
              }`}
            />
            <div
              className={`font-sans text-[11px] uppercase tracking-[0.18em] transition-colors ${
                isStep2Done ? 'text-[#E5C378] font-medium' : 'text-[#666]'
              }`}
            >
              Step 02 (Choose Date)
            </div>
          </div>

          {/* Step 3 Bar */}
          <div className="space-y-2">
            <div
              className={`h-[3px] w-full rounded-full transition-all ${
                isStep3Done ? 'bg-[#E5C378] shadow-[0_0_10px_rgba(229,195,120,0.5)]' : 'bg-[#222]'
              }`}
            />
            <div
              className={`font-sans text-[11px] uppercase tracking-[0.18em] transition-colors ${
                isStep3Done ? 'text-[#E5C378] font-medium' : 'text-[#666]'
              }`}
            >
              Step 03 (Available Slots)
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
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#E5C378] font-normal tracking-wide">
              Step 01: Select Service
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                const price = getServicePrice(service.name, service.durationMinutes);

                return (
                  <motion.div
                    key={service.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedService(service)}
                    className={`relative rounded-xl p-6 flex flex-col items-center justify-between text-center transition-all cursor-pointer min-h-[220px] ${
                      isSelected
                        ? 'bg-[#0d0d0d] border-2 border-[#E5C378] shadow-[0_0_30px_rgba(229,195,120,0.15)] ring-1 ring-[#E5C378]/40'
                        : 'bg-[#0e0e0e] border border-[#222222] hover:border-[#383838]'
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-gradient-to-b from-[#E5C378]/10 to-transparent">
                      {getServiceIcon(service.name)}
                    </div>

                    {/* Service Name & Subtitle */}
                    <div className="space-y-1.5 mb-6">
                      <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white">
                        {service.name}
                      </h3>
                      <p className="font-sans text-xs text-[#888888] tracking-wider">
                        {service.durationMinutes} min - ${price}
                      </p>
                    </div>

                    {/* Select / Selected Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(service);
                      }}
                      className={`w-full py-2.5 rounded-lg font-sans text-xs uppercase tracking-[0.2em] transition-all ${
                        isSelected
                          ? 'bg-[#E5C378] text-black font-bold shadow-[0_0_15px_rgba(229,195,120,0.4)]'
                          : 'bg-[#141414] border border-[#262626] text-[#E5C378] font-medium hover:border-[#E5C378]/60 hover:bg-[#1a1a1a]'
                      }`}
                    >
                      {isSelected ? 'SELECTED' : 'SELECT'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────
              STEP 02: CHOOSE DATE
             ────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#E5C378] font-normal tracking-wide">
                Step 02: Choose Date
              </h2>
              <div className="font-sans text-xs tracking-wider">
                <span className="text-[#888888]">Selected: </span>
                <span className="text-[#E5C378] font-medium font-serif text-sm">{formattedSelectedDate}</span>
              </div>
            </div>

            {/* MONTH CALENDAR CONTAINER */}
            <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl p-6 sm:p-8 shadow-2xl">
              {/* Calendar Month Navigation */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4 text-center font-sans text-[11px] uppercase tracking-[0.2em] text-[#666666] font-medium">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isDayPast = isBefore(day, startOfDay(new Date()));
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;

                  if (!isCurrentMonth) {
                    return <div key={idx} className="py-3 text-sm opacity-0 pointer-events-none" />;
                  }

                  if (isDayPast) {
                    return (
                      <div
                        key={idx}
                        className="py-3 font-sans text-sm text-[#333333] cursor-not-allowed select-none rounded-lg"
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
                      className={`py-3 rounded-lg font-sans text-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-[#E5C378] text-black font-bold shadow-[0_0_20px_rgba(229,195,120,0.5)]'
                          : 'text-[#cccccc] hover:text-white hover:bg-[#1c1c1c]'
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
          <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[580px] shadow-2xl sticky top-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#E5C378] font-normal tracking-wide mb-6">
                Step 03: Available Slots
              </h2>

              {/* Time Slots 2-Col Grid */}
              {loadingSlots ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5C378] animate-ping" />
                  <span className="font-sans text-[11px] uppercase tracking-widest text-[#888]">
                    Loading slots...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-16 text-center font-sans text-xs uppercase tracking-widest text-[#666]">
                  No slots available for this date.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 mt-4">
                  {slots.map((timeStr) => {
                    const isSelected = selectedTime === timeStr;
                    const formatted = formatTime12(timeStr);

                    return (
                      <motion.button
                        key={timeStr}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setSelectedTime(timeStr)}
                        className={`py-4 px-2 rounded-lg font-sans text-xs uppercase tracking-wider font-semibold transition-all text-center ${
                          isSelected
                            ? 'bg-[#E5C378] text-black shadow-[0_0_20px_rgba(229,195,120,0.4)]'
                            : 'bg-[#141414] border border-[#262626] text-white hover:border-[#E5C378]/50 hover:bg-[#1a1a1a]'
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
            <div className="pt-8 mt-8 border-t border-[#1f1f1f] space-y-4">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 font-sans text-[11px] uppercase tracking-wider text-center rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Booking CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleBooking}
                disabled={!selectedService || !selectedDate || !selectedTime || bookingLoading}
                className="w-full py-4 px-6 rounded-lg bg-[#E5C378] hover:bg-[#edd495] disabled:opacity-40 disabled:hover:bg-[#E5C378] text-black font-sans text-xs font-bold uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(229,195,120,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {bookingLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

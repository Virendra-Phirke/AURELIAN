import { useState, useEffect } from 'react';
import { format, addDays, parse } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, CheckCircle, ArrowRight } from 'lucide-react';

type Service = { id: string, name: string, durationMinutes: number };

const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10 }
};

export default function Booking() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(data => {
         if (Array.isArray(data)) {
           setServices(data);
           if (data.length > 0) setSelectedService(data[0]);
         }
      })
      .catch(e => console.error("Could not load services", e));
  }, []);

  useEffect(() => {
    if (!selectedService || !date) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/availability?date=${date}&service=${encodeURIComponent(selectedService.name)}`)
      .then(r => r.json())
      .then(data => setSlots(data))
      .catch(() => setError("Failed to load availability"))
      .finally(() => setLoadingSlots(false));
  }, [selectedService, date]);

  const handleBooking = async () => {
    if (!selectedService || !date || !selectedTime) return;
    setBookingLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date,
          time: selectedTime,
          note: ''
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return { val: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d'), dayOfWeek: format(d, 'EEE'), dayNum: format(d, 'd'), month: format(d, 'MMM') };
  });

  // Step indicator
  const currentStep = !selectedService ? 1 : !selectedTime ? (date ? 3 : 2) : 4;

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 mb-8 lg:mb-12">
        {[1, 2, 3].map(step => {
          const isActive = step === currentStep || (step === 2 && currentStep >= 2);
          return (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                {isActive && (
                  <motion.div 
                    layoutId="activeStepIndicator" 
                    className="absolute inset-0 rounded-full border border-[#C5A059]/50 bg-[#C5A059]/20" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center font-sans text-xs transition-all duration-300 ${
                  step < currentStep ? 'bg-[#C5A059] text-black' :
                  isActive ? 'text-[#C5A059]' :
                  'bg-[#111] text-[#555] border border-[#ffffff15]'
                }`}>
                  {step < currentStep ? <CheckCircle size={14} /> : step}
                </div>
              </div>
              {step < 3 && <div className={`w-8 sm:w-16 h-[2px] rounded transition-colors ${step < currentStep ? 'bg-[#C5A059]' : 'bg-[#ffffff15]'}`} />}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: Services (Top) + Dates (Bottom) */}
        <div className="lg:col-span-5 flex flex-col space-y-12">
          
          {/* Step 1: Select Service */}
          <motion.div variants={stepVariants} initial="initial" animate="animate">
            <div className="mb-6">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#C5A059] mb-3">Step 01</h4>
              <h1 className="text-3xl sm:text-4xl font-light leading-[1.1] text-white italic">Select Service</h1>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {services.map(s => (
                <motion.button
                  whileHover={{ x: 5, boxShadow: '0 10px 40px rgba(197,160,89,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`relative p-6 sm:p-8 border rounded-2xl transition-all text-left overflow-hidden ${
                    selectedService?.id === s.id 
                      ? 'bg-[#0a0a0a] border-[#C5A059] text-white shadow-[0_0_30px_rgba(197,160,89,0.15)]' 
                      : 'bg-[#0a0a0a] border-[#ffffff15] text-[#888] hover:border-[#ffffff30]'
                  }`}
                >
                  {selectedService?.id === s.id && (
                    <motion.div layoutId="activeServiceGlow" className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent pointer-events-none" />
                  )}
                  <div className="font-sans text-xs uppercase tracking-widest mb-2">{s.name}</div>
                  <div className="text-[#555] font-sans text-[10px] tracking-wider">{s.durationMinutes} min</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Step 2: Choose Date */}
          <AnimatePresence>
            {selectedService && (
              <motion.div variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-6">
                  <h4 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#C5A059] mb-3">Step 02</h4>
                  <h1 className="text-3xl sm:text-4xl font-light text-white italic flex items-center gap-3">
                    <CalendarDays size={28} className="text-[#C5A059]" />
                    Choose Date
                  </h1>
                </div>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {dates.map(d => (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      key={d.val}
                      onClick={() => setDate(d.val)}
                      className={`snap-center flex-shrink-0 px-5 sm:px-6 py-5 sm:py-6 border rounded-2xl min-w-[90px] sm:min-w-[110px] text-center transition-all ${
                        date === d.val
                          ? 'bg-[#C5A059] border-[#C5A059] text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                          : 'bg-[#0a0a0a] border-[#ffffff15] text-[#888] hover:border-[#ffffff30]'
                      }`}
                    >
                      <div className={`font-sans text-[10px] uppercase tracking-widest mb-2 ${date === d.val ? 'text-black/60' : 'text-[#555]'}`}>{d.dayOfWeek}</div>
                      <div className="text-2xl sm:text-3xl font-light">{d.dayNum}</div>
                      <div className={`font-sans text-[9px] uppercase tracking-widest mt-1 ${date === d.val ? 'text-black/60' : 'text-[#555]'}`}>{d.month}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Time Slots + Book Button */}
        <div className="lg:col-span-7 flex flex-col space-y-12">
          
          {/* Step 3: Available Slots */}
          <AnimatePresence>
            {selectedService && date && (
              <motion.div variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
                <div className="mb-6">
                  <h4 className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#C5A059] mb-3">Step 03</h4>
                  <h1 className="text-3xl sm:text-4xl font-light text-white italic flex items-center gap-3">
                    <Clock size={28} className="text-[#C5A059]" />
                    Available Slots
                  </h1>
                </div>
                {loadingSlots ? (
                  <div className="flex items-center gap-3 py-12 justify-center border border-[#ffffff15] rounded-2xl bg-[#0a0a0a] flex-1">
                    <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-8 sm:p-12 bg-[#0a0a0a] border border-[#ffffff15] text-center font-sans text-[11px] uppercase tracking-widest text-[#888] rounded-2xl flex-1 flex items-center justify-center">
                    No slots available for this date.
                  </div>
                ) : (
                  <div className="p-6 sm:p-8 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl flex-1">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
                      {slots.map((t, i) => (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-4 px-3 border text-center font-sans text-xs tracking-widest rounded-xl transition-all ${
                            selectedTime === t
                              ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                              : 'bg-[#111] border-[#ffffff15] text-[#888] hover:border-[#ffffff30] hover:text-white'
                          }`}
                        >
                          {t}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 font-sans text-[11px] uppercase tracking-widest text-center rounded-xl"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation */}
          <AnimatePresence>
            {selectedTime && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="shrink-0"
              >
                <div className="p-6 sm:p-8 bg-[#0a0a0a] border border-[#ffffff15] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-30" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div>
                      <div className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#C5A059] mb-2">Selected Appointment</div>
                      <div className="text-3xl font-light text-white italic">{selectedService?.name}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-sans text-[10px] uppercase tracking-widest text-[#555] mb-2">Date & Time</div>
                      <div className="text-xl font-light text-white">{format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')} <span className="text-[#C5A059]">•</span> {selectedTime}</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full py-5 bg-[#C5A059] text-black font-sans text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#d4b06a] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,89,0.2)] flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Appointment'}
                    <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

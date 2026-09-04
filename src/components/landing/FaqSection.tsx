import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ChevronDown, Sparkles, HelpCircle, Shield, Clock, Compass, Gem } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { TiltCard3D } from '../3d/TiltCard3D';

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    icon: Gem,
    category: 'The Experience',
    question: 'How do private suite appointments work?',
    answer:
      'Every Aurelian appointment is conducted in an acoustically isolated private suite. You enjoy tailored lighting, curated musical ambience, complimentary single-malt tasting or artisanal espresso, and unbroken one-on-one attention from your Grand Master with zero waiting or salon floor chatter.',
  },
  {
    icon: Shield,
    category: 'Reservations',
    question: 'How does your Zero Double-Booking lock guarantee work?',
    answer:
      'Aurelian operates an atomic reservation concurrency engine. The exact second you select an available time window, our system places an exclusive cryptographic lock on the slot. Double-bookings, schedule collisions, and waiting room delays are mathematically impossible.',
  },
  {
    icon: Clock,
    category: 'Policies',
    question: 'What is your cancellation and rescheduling policy?',
    answer:
      'We respect your sovereign time. You may cancel or reschedule your reservation with a single click via your client dashboard or confirmation link up to the designated advance cutoff without penalty.',
  },
  {
    icon: Compass,
    category: 'Mastery',
    question: 'What happens during the Morphological Profile Consultation?',
    answer:
      'Before a single blade touches your hair or beard, your stylist analyzes your facial symmetry, growth geometry, hair density, and lifestyle rhythm. We architect a profile tailored specifically to your facial contour rather than applying generic templates.',
  },
  {
    icon: Sparkles,
    category: 'Artisanal Care',
    question: 'What formulations and products are used during treatments?',
    answer:
      'We use exclusively cold-pressed, phyto-active botanical serums, Tuscan clay pomades, and Moroccan argan oils. Every formula is 100% organic, sulfate-free, and paraben-free, engineered to restore follicle vitality and dermal balance.',
  },
  {
    icon: HelpCircle,
    category: 'Access',
    question: 'Do you accommodate walk-in visits?',
    answer:
      'To ensure private suite exclusivity and unhurried craftsmanship for every patron, Aurelian operates strictly by reservation. Same-day appointments can be booked instantly online via our live portal whenever open slots are released.',
  },
];

export function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" ref={ref} className="relative py-24 px-6 sm:px-10 lg:px-16">
      <div className="max-w-4xl mx-auto space-y-14">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <p
            className="font-sans text-[10px] uppercase tracking-[0.3em] font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            Client Clarity &amp; Protocol
          </p>
          <h2
            className="font-brand text-4xl sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--color-primary-text)' }}
          >
            Frequently{' '}
            <span className="text-gold-gradient">
              Inquired
            </span>
          </h2>
          <p
            className="font-sans text-sm max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--color-secondary-text)' }}
          >
            Everything you need to know about our private suite rituals, reservation guarantees, and artisanal grooming standards.
          </p>
        </motion.div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon;
            const isOpen = openIndex === i;

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div
                  className="rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-xl"
                  style={{
                    background: isDark
                      ? (isOpen
                        ? 'linear-gradient(160deg, rgba(229,195,120,0.09) 0%, rgba(16,14,10,0.9) 100%)'
                        : 'linear-gradient(160deg, rgba(229,195,120,0.03) 0%, rgba(16,14,10,0.75) 100%)')
                      : (isOpen
                        ? 'linear-gradient(145deg, #ffffff 0%, #f4efe4 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)'),
                    borderColor: isDark
                      ? (isOpen ? 'rgba(229,195,120,0.35)' : 'rgba(229,195,120,0.14)')
                      : (isOpen ? 'rgba(184,134,11,0.35)' : 'rgba(196,151,42,0.2)'),
                    boxShadow: isDark
                      ? (isOpen
                        ? '0 12px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)'
                        : '6px 6px 20px rgba(0,0,0,0.4)')
                      : (isOpen
                        ? '8px 8px 24px rgba(190,175,145,0.25), -6px -6px 20px rgba(255,255,255,0.95), inset 0 1px 1px rgba(255,255,255,1)'
                        : '5px 5px 16px rgba(190,175,145,0.18), -4px -4px 14px rgba(255,255,255,0.9)'),
                  }}
                >
                  <button
                    onClick={() => toggle(i)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 backdrop-blur-md"
                        style={{
                          background: isDark
                            ? (isOpen ? 'rgba(229,195,120,0.2)' : 'rgba(229,195,120,0.08)')
                            : (isOpen ? 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)' : 'rgba(196,151,42,0.08)'),
                          border: isDark
                            ? (isOpen ? '1px solid rgba(229,195,120,0.4)' : '1px solid rgba(229,195,120,0.18)')
                            : (isOpen ? '1px solid rgba(196,151,42,0.35)' : '1px solid rgba(196,151,42,0.2)'),
                        }}
                      >
                        <Icon
                          size={18}
                          style={{
                            color: isOpen ? 'var(--color-primary)' : 'var(--color-secondary-text)',
                          }}
                        />
                      </div>
                      <div>
                        <span
                          className="font-sans text-[9px] uppercase tracking-widest font-semibold block mb-0.5"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {faq.category}
                        </span>
                        <h3
                          className="font-brand text-base sm:text-lg font-semibold transition-colors duration-200"
                          style={{ color: 'var(--color-primary-text)' }}
                        >
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300"
                      style={{
                        borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)',
                        background: isDark ? 'rgba(229,195,120,0.06)' : 'rgba(255,255,255,0.8)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown size={15} style={{ color: 'var(--color-primary)' }} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div
                          className="px-6 pb-6 pt-1 font-sans text-xs sm:text-sm leading-relaxed border-t"
                          style={{
                            color: 'var(--color-secondary-text)',
                            borderColor: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.12)',
                          }}
                        >
                          <p className="pt-3">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;

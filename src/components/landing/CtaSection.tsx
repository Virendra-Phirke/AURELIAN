import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShimmerButton } from '../magicui/shimmer-button';
import { ShineBorder } from '../magicui/shine-border';
import { ScrollOrb3D } from '../3d/ScrollOrb3D';
import { CalendarDays, Zap, Clock, ShieldCheck } from 'lucide-react';
import { ShopSettings } from '../../lib/useLandingData';
import { useTheme } from '../../lib/theme';

interface CtaSectionProps {
  shop?: ShopSettings | null;
}

export function CtaSection({ shop }: CtaSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const openingTime = shop?.openingTime || '09:00';
  const closingTime = shop?.closingTime || '20:00';
  const autoConfirmText = shop?.autoConfirmBookings ? 'Instant Auto-Confirmation' : 'Concierge-Confirmed';
  const cancelHours = shop?.cancellationCutoffHours ?? 24;
  const cancelLabel = `${cancelHours}h Flexible Cancellation`;

  // Formatted next slot preview
  const now = new Date();
  const slotHour = Math.max(10, Math.min(18, now.getHours() + 2));
  const slotTime = `Today at ${slotHour > 12 ? slotHour - 12 : slotHour}:00 ${slotHour >= 12 ? 'PM' : 'AM'}`;

  return (
    <section id="reserve" ref={ref} className="relative py-28 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center, rgba(229,195,120,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(196,151,42,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Flanking 3D Polyhedron models */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block"
      >
        <ScrollOrb3D variant="polyhedron" size={220} speed={0.6} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block"
      >
        <ScrollOrb3D variant="polyhedron" size={220} speed={0.75} />
      </motion.div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShineBorder
            borderRadius={32}
            borderWidth={1}
            color={isDark ? ['#e5c378', '#edd495', '#c4972a'] : ['#b8860b', '#d4af37', '#996515']}
          >
            <div
              className="rounded-3xl p-10 sm:p-16 text-center space-y-9 backdrop-blur-2xl transition-all duration-300"
              style={{
                background: isDark
                  ? 'linear-gradient(160deg, rgba(229,195,120,0.08) 0%, rgba(16,14,10,0.9) 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                boxShadow: isDark
                  ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 24px 64px -12px rgba(0,0,0,0.6)'
                  : '12px 12px 36px rgba(190, 175, 145, 0.28), -12px -12px 36px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
              }}
            >
              {/* Live slot badge */}
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md"
                style={{
                  background: isDark ? 'rgba(229,195,120,0.1)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                  borderColor: isDark ? 'rgba(229,195,120,0.25)' : 'rgba(196,151,42,0.3)',
                  boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1)' : 'inset 2px 2px 6px rgba(190,175,145,0.2), inset -2px -2px 6px rgba(255,255,255,0.9), 0 2px 8px rgba(196,151,42,0.12)',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                <span className="font-sans text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-body-text)' }}>
                  Next Available Slot
                </span>
                <span className="font-sans text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>
                  {slotTime}
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="font-brand text-4xl sm:text-5xl lg:text-6xl leading-tight" style={{ color: 'var(--color-primary-text)' }}>
                  Your{' '}
                  <span className="text-gold-gradient">
                    Signature
                  </span>{' '}
                  Awaits
                </h2>
                <p className="font-sans text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                  Reserve your private session with an Aurelian Grand Master. Bespoke, precise, and exclusively yours.
                  Operating hours: {openingTime} to {closingTime}.
                </p>
              </div>

              {/* Real Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: CalendarDays, label: autoConfirmText },
                  { icon: Zap, label: 'Zero Double-Booking Lock' },
                  { icon: Clock, label: cancelLabel },
                  { icon: ShieldCheck, label: 'Bespoke Private Suite' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-sans text-[10px] uppercase tracking-widest font-semibold backdrop-blur-md"
                    style={{
                      borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
                      color: 'var(--color-secondary-text)',
                      background: isDark ? 'rgba(229,195,120,0.05)' : 'linear-gradient(145deg, #ffffff 0%, #f4efe6 100%)',
                      boxShadow: isDark ? 'none' : '3px 3px 8px rgba(190,175,145,0.15), -2px -2px 6px rgba(255,255,255,0.9)',
                    }}
                  >
                    <Icon size={12} style={{ color: 'var(--color-primary)' }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-2">
                <Link to="/booking">
                  <ShimmerButton
                    className="px-10 py-4 font-sans text-xs uppercase tracking-widest font-bold shadow-lg cursor-pointer"
                    shimmerColor="rgba(255,255,255,0.35)"
                    background={isDark ? 'linear-gradient(135deg, #e5c378, #edd495)' : 'linear-gradient(135deg, #b8860b, #d4af37)'}
                    shimmerSize="0.07em"
                  >
                    <span style={{ color: isDark ? '#0a0a0a' : '#ffffff' }}>Reserve My Appointment</span>
                  </ShimmerButton>
                </Link>
                <Link
                  to="/register"
                  className="font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
                  style={{ color: 'var(--color-secondary-text)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary-text)')}
                >
                  Create Free Account →
                </Link>
              </div>
            </div>
          </ShineBorder>
        </motion.div>
      </div>
    </section>
  );
}

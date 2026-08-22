import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { CalendarDays, Zap, Clock } from 'lucide-react';
import { ShimmerButton } from '../magicui/shimmer-button';
import { ShineBorder } from '../magicui/shine-border';

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  // Simulated next available slot
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const slotTime = `Tomorrow, ${tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · 10:00 AM`;

  return (
    <section className="relative py-24 px-6 sm:px-10 lg:px-16 overflow-hidden" ref={ref}>
      {/* BG Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(229,195,120,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShineBorder
            borderRadius={24}
            borderWidth={1}
            color={['#e5c378', '#edd495', '#c4972a']}
          >
            <div
              className="rounded-3xl p-10 sm:p-16 text-center space-y-8"
              style={{
                background: 'var(--color-surface)',
              }}
            >
              {/* Live slot badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{
                background: 'rgba(229,195,120,0.06)',
                borderColor: 'rgba(229,195,120,0.2)',
              }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
                <span className="font-sans text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--color-body-text)' }}>
                  Next Available Slot
                </span>
                <span className="font-sans text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {slotTime}
                </span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="font-brand text-4xl sm:text-5xl lg:text-6xl leading-tight" style={{ color: 'var(--color-primary-text)' }}>
                  Your{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 50%, var(--color-primary) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Signature
                  </span>{' '}
                  Awaits
                </h2>
                <p className="font-sans text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                  Reserve your private session with an Aurelian Grand Master. Bespoke, precise, and exclusively yours.
                  Zero conflicts. One click.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: CalendarDays, label: 'Instant Confirmation' },
                  { icon: Zap, label: 'Atomic Slot Locking' },
                  { icon: Clock, label: 'Free 24hr Cancellation' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border font-sans text-[10px] uppercase tracking-widest font-semibold"
                    style={{
                      borderColor: 'rgba(229,195,120,0.15)',
                      color: 'var(--color-secondary-text)',
                      background: 'rgba(229,195,120,0.03)',
                    }}
                  >
                    <Icon size={12} style={{ color: 'var(--color-primary)' }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/booking">
                  <ShimmerButton
                    className="px-10 py-4 font-sans text-xs uppercase tracking-widest font-bold"
                    shimmerColor="rgba(255,255,255,0.25)"
                    background="linear-gradient(135deg, #e5c378, #edd495)"
                    shimmerSize="0.07em"
                  >
                    <span style={{ color: '#0a0a0a' }}>Reserve My Appointment</span>
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

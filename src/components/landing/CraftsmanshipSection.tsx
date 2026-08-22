import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Compass, Sparkles, Flame, Crown } from 'lucide-react';
import { ScrollOrb3D } from '../3d/ScrollOrb3D';
import { useTheme } from '../../lib/theme';

const STEPS = [
  {
    step: '01',
    icon: Compass,
    title: 'Profile Consultation',
    description:
      'A personal analysis of cranial architecture, growth patterns, and lifestyle cadence before a single blade is drawn.',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Thermal Cleansing',
    description:
      'Botanical steam infused with eucalyptus and neroli, softening follicles and opening pores for an unhurried shave.',
  },
  {
    step: '03',
    icon: Flame,
    title: 'Master Sculpting',
    description:
      'Japanese steel hand-ground to razor acuity. Every stroke deliberate, quiet, and calibrated to your natural silhouette.',
  },
  {
    step: '04',
    icon: Crown,
    title: 'Aromatic Finish',
    description:
      'Cold marble stone closure, bespoke amber cologne mist, and an artisanal neck massage to seal the transformation.',
  },
];

export function CraftsmanshipSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <section id="craftsmanship" ref={ref} className="relative py-28 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <p
          className="font-brand text-[20vw] font-black tracking-widest select-none"
          style={{ color: 'var(--color-primary)' }}
        >
          AURELIAN
        </p>
      </div>

      {/* 3D Polyhedron accents — top corners */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute top-8 right-8 pointer-events-none hidden lg:block"
      >
        <ScrollOrb3D variant="polyhedron" size={180} speed={0.6} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute bottom-8 left-8 pointer-events-none hidden lg:block"
      >
        <ScrollOrb3D variant="polyhedron" size={140} speed={0.8} />
      </motion.div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 max-w-2xl mx-auto"
        >
          <p
            className="font-sans text-[10px] uppercase tracking-[0.3em] font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            The Four-Act Ritual
          </p>
          <h2
            className="font-brand text-4xl sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--color-primary-text)' }}
          >
            The{' '}
            <span className="text-gold-gradient">
              Craftsmanship
            </span>{' '}
            Journey
          </h2>
          <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            From the moment you arrive to the lingering effect of transformation — a four-act ceremony
            conducted exclusively for you.
          </p>
        </motion.div>

        {/* Steps — horizontal timeline with Neumorphic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div
            className="absolute top-12 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{ background: isDark ? 'linear-gradient(to right, transparent, rgba(229,195,120,0.3), rgba(229,195,120,0.5), rgba(229,195,120,0.3), transparent)' : 'linear-gradient(to right, transparent, rgba(196,151,42,0.3), rgba(196,151,42,0.6), rgba(196,151,42,0.3), transparent)' }}
          />

          {STEPS.map(({ step, icon: Icon, title, description }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-7 rounded-3xl border backdrop-blur-xl flex flex-col items-center text-center lg:items-start lg:text-left gap-5 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: isDark
                  ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, rgba(16,14,10,0.85) 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
                boxShadow: isDark
                  ? '10px 10px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)'
                  : '8px 8px 24px rgba(190, 175, 145, 0.25), -8px -8px 24px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
              }}
            >
              {/* Step circle */}
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-md relative"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.12)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                    borderColor: isDark ? 'rgba(229,195,120,0.35)' : 'rgba(196,151,42,0.3)',
                    boxShadow: isDark
                      ? 'inset 0 1px 1px rgba(255,255,255,0.15), 0 0 20px rgba(229,195,120,0.15)'
                      : 'inset 2px 2px 6px rgba(190,175,145,0.2), inset -2px -2px 6px rgba(255,255,255,0.9), 0 2px 8px rgba(196,151,42,0.15)',
                  }}
                >
                  <Icon size={20} style={{ color: 'var(--color-primary)' }} />

                  {/* Step number badge */}
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-brand text-[10px] font-bold shadow-md"
                    style={{
                      background: isDark ? 'var(--color-primary)' : 'linear-gradient(135deg, #b8860b 0%, #996515 100%)',
                      color: isDark ? '#060606' : '#ffffff',
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Step {step}
                </p>
                <h3 className="font-brand text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                  {title}
                </h3>
                <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                  {description}
                </p>
              </div>

              {/* Vertical connector on mobile */}
              {i < STEPS.length - 1 && (
                <div
                  className="lg:hidden absolute -bottom-4 left-1/2 w-px h-4"
                  style={{ background: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)' }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

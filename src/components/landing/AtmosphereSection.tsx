import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { TiltCard3D } from '../3d/TiltCard3D';
import { NumberTicker } from '../magicui/number-ticker';
import { Target, Gem, Leaf, Shield } from 'lucide-react';
import { LandingStats } from '../../lib/useLandingData';
import { useTheme } from '../../lib/theme';

const PILLARS = [
  {
    icon: Target,
    title: 'Haute Precision',
    description:
      'Every cut is a study in mathematical geometry. Our Grand Masters calibrate angles to 0.5mm tolerances, sculpting profiles unique to each face.',
    stat: '12+',
    statLabel: 'Years avg. experience',
  },
  {
    icon: Gem,
    title: 'Private Sanctuary',
    description:
      'Bespoke suite appointments with curated ambience — single-malt whisky, pressed linens, and acoustically isolated chambers. Your time is sovereign.',
    stat: '100%',
    statLabel: 'Private suites',
  },
  {
    icon: Leaf,
    title: 'Artisanal Formulas',
    description:
      'A proprietary selection of cold-pressed, phyto-active grooming formulations — no sulphates, no synthetics. Ingredients sourced from Moroccan atlases and Tuscan valleys.',
    stat: '34',
    statLabel: 'Organic active ingredients',
  },
  {
    icon: Shield,
    title: 'Zero Conflicts',
    description:
      'Our atomic Redis concurrency system guarantees your reserved slot is exclusively yours — zero double-bookings, zero wait conflicts. A digital promise.',
    stat: '0',
    statLabel: 'Double bookings, ever',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

interface AtmosphereSectionProps {
  stats?: LandingStats;
}

export function AtmosphereSection({ stats }: AtmosphereSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const totalBookings = stats?.totalBookings ?? 0;
  const totalClients = stats?.totalClients ?? 0;
  const totalServices = stats?.totalServices ?? 0;
  const satisfactionRate = stats?.satisfactionRate ?? 98;

  const metrics = [
    { end: totalBookings, label: 'Appointments Completed', suffix: totalBookings >= 100 ? '+' : '' },
    { end: totalClients, label: 'Registered Clients', suffix: totalClients >= 100 ? '+' : '' },
    { end: satisfactionRate, label: 'Client Satisfaction', suffix: '%' },
    { end: totalServices, label: 'Active Services', suffix: '' },
  ];

  return (
    <section id="atmosphere" ref={ref} className="relative py-24 px-6 sm:px-10 lg:px-16">
      {/* Top subtle glow */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, rgba(229,195,120,0.04) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(196,151,42,0.06) 0%, transparent 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto space-y-16">
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
            The Aurelian Philosophy
          </p>
          <h2
            className="font-brand text-4xl sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--color-primary-text)' }}
          >
            Crafted Without{' '}
            <span
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #e5c378 0%, #fff0c0 100%)'
                  : 'linear-gradient(135deg, #b8860b 0%, #996515 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Compromise
            </span>
          </h2>
          <p
            className="font-sans text-sm max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--color-secondary-text)' }}
          >
            Four founding commitments that define every Aurelian experience — non-negotiable standards
            that transform a grooming visit into a life-affirming ritual.
          </p>
        </motion.div>

        {/* Pillars Grid — Neumorphic extruded cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {PILLARS.map(({ icon: Icon, title, description, stat, statLabel }) => (
            <motion.div key={title} variants={itemVariants}>
              <TiltCard3D
                className="h-full rounded-2xl border p-6 space-y-5 backdrop-blur-xl transition-all duration-300"
                style={{
                  background: isDark
                    ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, rgba(16,14,10,0.85) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                  borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.25)',
                  boxShadow: isDark
                    ? '10px 10px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)'
                    : '8px 8px 24px rgba(190, 175, 145, 0.25), -8px -8px 24px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
                }}
              >
                {/* Neumorphic sunken icon well */}
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center backdrop-blur-md"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.12)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                    border: isDark ? '1px solid rgba(229,195,120,0.25)' : '1px solid rgba(196,151,42,0.3)',
                    boxShadow: isDark
                      ? 'inset 0 1px 1px rgba(255,255,255,0.15)'
                      : 'inset 2px 2px 6px rgba(190,175,145,0.2), inset -2px -2px 6px rgba(255,255,255,0.9), 0 2px 8px rgba(196,151,42,0.15)',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--color-primary)' }} />
                </div>

                {/* Stat */}
                <div>
                  <p className="font-brand text-3xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                    {stat}
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                    {statLabel}
                  </p>
                </div>

                <div className="border-t" style={{ borderColor: isDark ? 'rgba(229,195,120,0.12)' : 'rgba(196,151,42,0.15)' }} />

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="font-brand text-base font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                    {title}
                  </h3>
                  <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                    {description}
                  </p>
                </div>
              </TiltCard3D>
            </motion.div>
          ))}
        </motion.div>

        {/* Live Metrics Bar from Database — Neumorphic Extrusion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl border backdrop-blur-2xl"
          style={{
            borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)',
            background: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.15)',
            boxShadow: isDark
              ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 20px 48px -10px rgba(0,0,0,0.6)'
              : '10px 10px 30px rgba(190, 175, 145, 0.25), -10px -10px 30px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
          }}
        >
          {metrics.map(({ end, label, suffix }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-9 px-4 gap-2.5 backdrop-blur-xl transition-colors duration-300"
              style={{ background: isDark ? 'rgba(16,14,10,0.85)' : 'linear-gradient(180deg, #ffffff 0%, #f7f4ec 100%)' }}
            >
              <div className="flex items-baseline gap-0.5">
                {inView && (
                  <NumberTicker
                    value={end}
                    className="font-brand text-4xl sm:text-5xl font-bold"
                  />
                )}
                <span className="font-brand text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {suffix}
                </span>
              </div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-center font-semibold" style={{ color: 'var(--color-muted-text)' }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { TiltCard3D } from '../3d/TiltCard3D';
import { NumberTicker } from '../magicui/number-ticker';
import { Target, Gem, Leaf, Shield } from 'lucide-react';
import { LandingStats } from '../../lib/useLandingData';

const PILLARS = [
  {
    icon: Target,
    title: 'Haute Precision',
    description:
      'Every cut is a study in mathematical geometry. Our Grand Masters calibrate angles to 0.5mm tolerances, sculpting profiles unique to each face.',
    stat: '12+',
    statLabel: 'Years avg. experience',
    gradient: 'from-[#e5c378]/10 to-transparent',
  },
  {
    icon: Gem,
    title: 'Private Sanctuary',
    description:
      'Bespoke suite appointments with curated ambience — single-malt whisky, pressed linens, and acoustically isolated chambers. Your time is sovereign.',
    stat: '100%',
    statLabel: 'Private suites',
    gradient: 'from-[#c4972a]/10 to-transparent',
  },
  {
    icon: Leaf,
    title: 'Artisanal Formulas',
    description:
      'A proprietary selection of cold-pressed, phyto-active grooming formulations — no sulphates, no synthetics. Ingredients sourced from Moroccan atlases and Tuscan valleys.',
    stat: '34',
    statLabel: 'Organic active ingredients',
    gradient: 'from-[#e5c378]/10 to-transparent',
  },
  {
    icon: Shield,
    title: 'Zero Conflicts',
    description:
      'Our atomic Redis concurrency system guarantees your reserved slot is exclusively yours — zero double-bookings, zero wait conflicts. A digital promise.',
    stat: '0',
    statLabel: 'Double bookings, ever',
    gradient: 'from-[#c4972a]/10 to-transparent',
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

  const metrics = [
    { end: stats?.totalBookings || 2400, label: 'Appointments Completed', suffix: '+' },
    { end: stats?.totalClients || 1850, label: 'Registered Clients', suffix: '+' },
    { end: stats?.satisfactionRate || 99, label: 'Client Satisfaction', suffix: '%' },
    { end: stats?.totalServices || 8, label: 'Signature Services', suffix: '' },
  ];

  return (
    <section id="atmosphere" ref={ref} className="relative py-24 px-6 sm:px-10 lg:px-16">
      {/* Subtle top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(229,195,120,0.03) 0%, transparent 100%)' }}
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
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 100%)',
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

        {/* Pillars Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {PILLARS.map(({ icon: Icon, title, description, stat, statLabel, gradient }) => (
            <motion.div key={title} variants={itemVariants}>
              <TiltCard3D
                className="h-full rounded-2xl border p-6 space-y-4"
                style={{
                  background: gradient.includes('e5c378')
                    ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, var(--color-surface) 100%)'
                    : 'linear-gradient(160deg, rgba(196,151,42,0.06) 0%, var(--color-surface) 100%)',
                  borderColor: 'rgba(229,195,120,0.12)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(229,195,120,0.1)',
                    border: '1px solid rgba(229,195,120,0.2)',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--color-primary)' }} />
                </div>

                {/* Stat */}
                <div>
                  <p className="font-brand text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {stat}
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                    {statLabel}
                  </p>
                </div>

                <div className="border-t" style={{ borderColor: 'rgba(229,195,120,0.1)' }} />

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

        {/* Live Metrics Bar from Database */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border"
          style={{ borderColor: 'rgba(229,195,120,0.1)', background: 'rgba(229,195,120,0.08)' }}
        >
          {metrics.map(({ end, label, suffix }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-8 px-4 gap-2"
              style={{ background: 'var(--color-surface)' }}
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
              <p className="font-sans text-[10px] uppercase tracking-widest text-center" style={{ color: 'var(--color-muted-text)' }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

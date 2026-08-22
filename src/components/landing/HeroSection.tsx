import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { HeroCenterpiece3D } from '../3d/HeroCenterpiece3D';
import { Star, Users, Sparkles, ChevronDown } from 'lucide-react';
import { ShopSettings, LandingStats } from '../../lib/useLandingData';

const BADGE_DELAY = 0.1;

interface HeroSectionProps {
  shop?: ShopSettings;
  stats?: LandingStats;
}

export function HeroSection({ shop, stats }: HeroSectionProps) {
  const scrollInto = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const c = document.getElementById('landing-scroll');
      c ? c.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }) : el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clientCount = stats?.totalClients ?? 0;
  const clientCountStr = clientCount >= 100 ? `${clientCount.toLocaleString()}+` : `${clientCount}`;

  const servicesCount = stats?.totalServices ?? 0;
  const servicesCountStr = servicesCount > 0 ? `${servicesCount} Signature Services` : 'Bespoke Services';

  const satisfactionRate = stats?.satisfactionRate ?? 98;

  const floatBadges = [
    { icon: Star, label: `${satisfactionRate}%`, sub: 'Satisfaction Rate', pos: 'top-8 left-6' },
    { icon: Users, label: clientCountStr, sub: 'Loyal Clients', pos: 'bottom-16 left-2' },
    { icon: Sparkles, label: servicesCountStr, sub: 'Crafted Packages', pos: 'top-12 right-4' },
  ];

  const tagline = shop?.shopTagline || 'Luxury Grooming & Styling';
  const clientInitials = stats?.clientInitials && stats.clientInitials.length > 0 ? stats.clientInitials : ['A', 'V', 'R', 'S'];

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-12 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(229,195,120,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
        {/* Left — Text Block */}
        <div className="relative z-10 space-y-7">
          {/* Pill Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full border"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'rgba(229,195,120,0.3)',
              background: 'rgba(229,195,120,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
            {tagline}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-brand text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.0] tracking-tight"
            style={{ color: 'var(--color-primary-text)' }}
          >
            The Art{' '}
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 50%, var(--color-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              of Grooming
            </span>
            Perfected
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="font-sans text-sm sm:text-base leading-relaxed max-w-[440px]"
            style={{ color: 'var(--color-secondary-text)' }}
          >
            {shop?.shopName || 'Aurelian'} is more than a salon — it is a private sanctuary. Every appointment is an exercise in
            haute precision, artisanal treatment rituals, and tailored aesthetic mastery conducted in private suites.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <Link
              to="/booking"
              className="group inline-flex items-center gap-2.5 font-sans text-xs uppercase tracking-widest font-semibold px-7 py-3.5 rounded-full transition-all duration-300 shadow-lg"
              style={{
                color: 'var(--color-bg)',
                background: 'linear-gradient(135deg, var(--color-primary), #edd495)',
                boxShadow: '0 8px 30px rgba(229,195,120,0.3)',
              }}
            >
              Reserve an Appointment
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <button
              onClick={() => scrollInto('services')}
              className="inline-flex items-center gap-2.5 font-sans text-xs uppercase tracking-widest font-semibold px-7 py-3.5 rounded-full border transition-all duration-300 cursor-pointer"
              style={{
                color: 'var(--color-primary)',
                borderColor: 'rgba(229,195,120,0.3)',
                background: 'rgba(229,195,120,0.04)',
              }}
            >
              Explore Services
            </button>
          </motion.div>

          {/* Divider + Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-6 pt-4"
          >
            <div className="flex -space-x-2">
              {clientInitials.map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-brand text-xs font-bold border-2"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{clientCountStr}</span>{' '}
              discerning clients trust {shop?.shopName || 'Aurelian'} for their signature look
            </p>
          </motion.div>
        </div>

        {/* Right — 3D Centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[380px] sm:h-[480px] lg:h-[600px]"
        >
          {/* Subtle glow behind */}
          <div
            className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(229,195,120,0.12) 0%, transparent 70%)' }}
          />

          {/* Floating stat badges */}
          {floatBadges.map(({ icon: Icon, label, sub, pos }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + i * BADGE_DELAY }}
              className={`absolute ${pos} z-20 pointer-events-none`}
              style={{
                animation: `float-badge ${3 + i * 0.7}s ease-in-out infinite alternate`,
              }}
            >
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border backdrop-blur-xl"
                style={{
                  background: 'rgba(6,6,6,0.75)',
                  borderColor: 'rgba(229,195,120,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(229,195,120,0.15)' }}
                >
                  <Icon size={14} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-brand text-sm font-semibold leading-none" style={{ color: 'var(--color-primary)' }}>{label}</p>
                  <p className="font-sans text-[10px] mt-0.5" style={{ color: 'var(--color-secondary-text)' }}>{sub}</p>
                </div>
              </div>
            </motion.div>
          ))}

          <HeroCenterpiece3D />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={() => scrollInto('atmosphere')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer group"
      >
        <span className="font-sans text-[9px] uppercase tracking-[0.25em]" style={{ color: 'var(--color-muted-text)' }}>
          Discover
        </span>
        <ChevronDown
          size={16}
          className="animate-bounce"
          style={{ color: 'var(--color-primary)' }}
        />
      </motion.button>
    </section>
  );
}

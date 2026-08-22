import React, { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Star, Users, Sparkles, ChevronDown } from 'lucide-react';
import { ShopSettings, LandingStats } from '../../lib/useLandingData';
import { useTheme } from '../../lib/theme';

const HeroCenterpiece3D = lazy(() => import('../3d/HeroCenterpiece3D'));

const BADGE_DELAY = 0.1;

interface HeroSectionProps {
  shop?: ShopSettings;
  stats?: LandingStats;
}

export function HeroSection({ shop, stats }: HeroSectionProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const scrollInto = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const c = document.getElementById('landing-scroll');
      c ? c.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }) : el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clientCount = stats?.totalClients ?? 0;
  const clientCountStr = clientCount > 0 ? `${clientCount}` : '0';

  const servicesCount = stats?.totalServices ?? 0;
  const servicesCountStr = servicesCount > 0 ? `${servicesCount} Signature Services` : 'Bespoke Atelier';

  const bookingsCount = stats?.totalBookings ?? 0;
  const bookingsCountStr = bookingsCount > 0 ? `${bookingsCount} Completed` : 'Private Sanctuary';

  const floatBadges = [
    { icon: Star, label: bookingsCount > 0 ? '100%' : 'Bespoke', sub: bookingsCount > 0 ? 'Satisfaction Rate' : 'Private Suites', pos: 'top-8 left-6' },
    { icon: Users, label: clientCount > 0 ? `${clientCountStr} Loyal Clients` : 'Private Atelier', sub: 'Verified Patrons', pos: 'bottom-16 left-2' },
    { icon: Sparkles, label: servicesCountStr, sub: 'Crafted Packages', pos: 'top-12 right-4' },
  ];

  const tagline = shop?.shopTagline || 'Luxury Grooming & Styling';
  const clientInitials = stats?.clientInitials || [];

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
          <div
            className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] font-semibold px-5 py-2.5 rounded-full border backdrop-blur-xl"
            style={{
              color: 'var(--color-primary)',
              borderColor: isDark ? 'rgba(229,195,120,0.3)' : 'rgba(196,151,42,0.35)',
              background: isDark
                ? 'linear-gradient(135deg, rgba(229,195,120,0.12) 0%, rgba(16,14,10,0.6) 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f4efe6 100%)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)'
                : '4px 4px 12px rgba(190,175,145,0.22), -3px -3px 8px rgba(255,255,255,0.95), inset 0 1px 1px rgba(255,255,255,1)',
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
            {tagline}
          </div>

          {/* Headline - Rendered with immediate paint for lightning-fast LCP */}
          <h1
            className="font-brand text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.0] tracking-tight"
            style={{ color: 'var(--color-primary-text)' }}
          >
            The Art{' '}
            <span className="block text-gold-gradient">
              of Grooming
            </span>
            Perfected
          </h1>

          {/* Subtitle */}
          <p
            className="font-sans text-sm sm:text-base leading-relaxed max-w-[440px]"
            style={{ color: 'var(--color-secondary-text)' }}
          >
            {shop?.shopName || 'Aurelian'} is more than a salon — it is a private sanctuary. Every appointment is an exercise in
            haute precision, artisanal treatment rituals, and tailored aesthetic mastery conducted in private suites.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/booking"
              className="group inline-flex items-center gap-2.5 font-sans text-xs uppercase tracking-widest font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg cursor-pointer hover:scale-105"
              style={{
                color: isDark ? '#060606' : '#ffffff',
                background: isDark
                  ? 'linear-gradient(135deg, #e5c378, #edd495)'
                  : 'linear-gradient(135deg, #b8860b 0%, #d4af37 50%, #996515 100%)',
                boxShadow: isDark
                  ? '0 8px 30px rgba(229,195,120,0.3)'
                  : '6px 6px 18px rgba(184,134,11,0.35), -3px -3px 10px rgba(255,255,255,0.9), inset 0 1px 1px rgba(255,255,255,0.5)',
              }}
            >
              Reserve an Appointment
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <button
              onClick={() => scrollInto('services')}
              className="inline-flex items-center gap-2.5 font-sans text-xs uppercase tracking-widest font-semibold px-8 py-4 rounded-full border transition-all duration-300 cursor-pointer hover:scale-105"
              style={{
                color: 'var(--color-primary)',
                borderColor: isDark ? 'rgba(229,195,120,0.3)' : 'rgba(196,151,42,0.35)',
                background: isDark
                  ? 'rgba(229,195,120,0.06)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f4efe6 100%)',
                boxShadow: isDark
                  ? 'none'
                  : '4px 4px 12px rgba(190,175,145,0.2), -3px -3px 8px rgba(255,255,255,0.95)',
              }}
            >
              Explore Services
            </button>
          </div>

          {/* Divider + Credentials with Neumorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-flex items-center gap-4 p-4 pr-7 rounded-2xl border backdrop-blur-xl"
            style={{
              background: isDark
                ? 'linear-gradient(160deg, rgba(229,195,120,0.08) 0%, rgba(16,14,10,0.85) 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
              borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.22)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 12px 30px -8px rgba(0,0,0,0.4)'
                : '6px 6px 18px rgba(190, 175, 145, 0.2), -6px -6px 18px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
            }}
          >
            <div className="flex -space-x-2">
              {clientInitials.length > 0 ? (
                clientInitials.map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-brand text-xs font-bold border-2 backdrop-blur-md"
                    style={{
                      background: isDark ? 'rgba(229,195,120,0.18)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '1px 1px 4px rgba(190,175,145,0.25)',
                    }}
                  >
                    {l}
                  </div>
                ))
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-brand text-xs font-bold border-2 backdrop-blur-md"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.18)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  ⚜
                </div>
              )}
            </div>
            <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>
              {clientCount > 0 ? (
                <>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{clientCountStr}</span>{' '}
                  discerning {clientCount === 1 ? 'client' : 'clients'} trust {shop?.shopName || 'Aurelian'}
                </>
              ) : (
                <>
                  Private sanctuary for discerning patrons of <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{shop?.shopName || 'Aurelian'}</span>
                </>
              )}
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
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(229,195,120,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(196,151,42,0.15) 0%, transparent 70%)',
            }}
          />

          {/* Floating stat badges — Neumorphic extruded pills */}
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
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl"
                style={{
                  background: isDark ? 'rgba(16,14,10,0.85)' : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                  borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.22)',
                  boxShadow: isDark
                    ? '0 10px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)'
                    : '6px 6px 18px rgba(190, 175, 145, 0.22), -4px -4px 14px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.15)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
                    border: isDark ? '1px solid rgba(229,195,120,0.2)' : '1px solid rgba(196,151,42,0.25)',
                    boxShadow: isDark ? 'none' : 'inset 1px 1px 3px rgba(190,175,145,0.2)',
                  }}
                >
                  <Icon size={15} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-brand text-sm font-bold leading-none" style={{ color: 'var(--color-primary)' }}>{label}</p>
                  <p className="font-sans text-[10px] font-medium mt-0.5" style={{ color: 'var(--color-secondary-text)' }}>{sub}</p>
                </div>
              </div>
            </motion.div>
          ))}

          <Suspense fallback={<div className="w-full h-full" />}>
            <HeroCenterpiece3D />
          </Suspense>
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

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { FloatingCanvas3D } from '../components/3d/FloatingCanvas3D';
import { ScrollOrb3D } from '../components/3d/ScrollOrb3D';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { AtmosphereSection } from '../components/landing/AtmosphereSection';
import { ServicesSection } from '../components/landing/ServicesSection';
import { CraftsmanshipSection } from '../components/landing/CraftsmanshipSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CtaSection } from '../components/landing/CtaSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { useLandingData } from '../lib/useLandingData';

// Scroll progress indicator
function ScrollProgress() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ container: containerRef as React.RefObject<HTMLElement> });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    containerRef.current = document.getElementById('landing-scroll');
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(to right, var(--color-primary), #fff0c0)',
      }}
    />
  );
}

// Orb-accented gold divider placed between each section
function GoldDivider({
  variant = 'ring',
  side = 'left',
}: {
  variant?: 'orb' | 'ring' | 'diamond' | 'helix' | 'star';
  side?: 'left' | 'right';
}) {
  return (
    <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center gap-6">
      {/* Left orb */}
      {side === 'left' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          <ScrollOrb3D variant={variant} size={64} speed={0.8} />
        </motion.div>
      )}

      {/* Divider line */}
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(to right, rgba(229,195,120,0.25), rgba(229,195,120,0.12), transparent)' }}
      />

      {/* Center diamond accent */}
      <div
        className="shrink-0 w-1.5 h-1.5 rotate-45 border"
        style={{ borderColor: 'rgba(229,195,120,0.4)', background: 'rgba(229,195,120,0.15)' }}
      />

      {/* Right divider line */}
      <div
        className="flex-1 h-px"
        style={{ background: 'linear-gradient(to left, rgba(229,195,120,0.25), rgba(229,195,120,0.12), transparent)' }}
      />

      {/* Right orb */}
      {side === 'right' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          <ScrollOrb3D variant={variant} size={64} speed={0.8} />
        </motion.div>
      )}
    </div>
  );
}

export default function Landing() {
  const { services, shop, stats, loading } = useLandingData();

  return (
    <div className="relative h-full" style={{ background: 'var(--color-bg)' }}>
      {/* Full-page WebGL 3D background — camera scrolls with page */}
      <FloatingCanvas3D />

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Fixed Header with live shop announcement and brand */}
      <LandingHeader shop={shop} />

      {/* Scrollable Content */}
      <div
        id="landing-scroll"
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(229,195,120,0.2) transparent' }}
      >
        {/* Hero with live shop tagline, live client count, and 3D kinetic centerpiece */}
        <HeroSection shop={shop} stats={stats} />

        {/* ── Section break: diamond accent + right orb ── */}
        <GoldDivider variant="diamond" side="right" />

        {/* Philosophy & Atmosphere with live DB metric tickers */}
        <AtmosphereSection stats={stats} />

        {/* ── Section break: helix knot + left orb ── */}
        <GoldDivider variant="helix" side="left" />

        {/* Services Showcase loaded directly from Database */}
        <ServicesSection services={services} shop={shop} loading={loading} />

        {/* ── Section break: ring + right orb ── */}
        <GoldDivider variant="ring" side="right" />

        {/* Craftsmanship Journey Protocol */}
        <CraftsmanshipSection />

        {/* ── Section break: star + left orb ── */}
        <GoldDivider variant="star" side="left" />

        {/* Client Reviews / Comments Marquee */}
        <TestimonialsSection />

        {/* ── Section break: orb + right ── */}
        <GoldDivider variant="orb" side="right" />

        {/* Grand CTA with real DB shop hours, cancellation cutoff, and instant booking lock */}
        <CtaSection shop={shop} />

        {/* Footer with real salon contact details, opening hours, and address */}
        <LandingFooter shop={shop} />
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { FloatingCanvas3D } from '../components/3d/FloatingCanvas3D';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { AtmosphereSection } from '../components/landing/AtmosphereSection';
import { ServicesSection } from '../components/landing/ServicesSection';
import { CraftsmanshipSection } from '../components/landing/CraftsmanshipSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CtaSection } from '../components/landing/CtaSection';
import { LandingFooter } from '../components/landing/LandingFooter';

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
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(to right, var(--color-primary), #fff0c0)',
      }}
    />
  );
}

// Section divider
function GoldDivider() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(to right, transparent, rgba(229,195,120,0.2), rgba(229,195,120,0.15), transparent)' }}
      />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative h-full" style={{ background: 'var(--color-bg)' }}>
      {/* 3D Background Canvas */}
      <FloatingCanvas3D />

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Fixed Header */}
      <LandingHeader />

      {/* Scrollable Content */}
      <div
        id="landing-scroll"
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(229,195,120,0.2) transparent' }}
      >
        {/* Hero */}
        <HeroSection />

        <GoldDivider />

        {/* Philosophy & Atmosphere */}
        <AtmosphereSection />

        <GoldDivider />

        {/* Services Showcase */}
        <ServicesSection />

        <GoldDivider />

        {/* Craftsmanship Journey */}
        <CraftsmanshipSection />

        <GoldDivider />

        {/* Client Testimonials */}
        <TestimonialsSection />

        <GoldDivider />

        {/* Grand CTA */}
        <CtaSection />

        {/* Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}

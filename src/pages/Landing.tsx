import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { ScrollOrb3D } from '../components/3d/ScrollOrb3D';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { useLandingData } from '../lib/useLandingData';

// Background 3D canvases loaded asynchronously after first paint
const FloatingCanvas3D = lazy(() => import('../components/3d/FloatingCanvas3D').then(m => ({ default: m.FloatingCanvas3D })));
const FloatingPolyhedronPath = lazy(() => import('../components/3d/FloatingPolyhedronPath').then(m => ({ default: m.FloatingPolyhedronPath })));

// Below-the-fold sections loaded on-demand via dynamic chunk splitting
const AtmosphereSection = lazy(() => import('../components/landing/AtmosphereSection').then(m => ({ default: m.AtmosphereSection })));
const ServicesSection = lazy(() => import('../components/landing/ServicesSection').then(m => ({ default: m.ServicesSection })));
const CraftsmanshipSection = lazy(() => import('../components/landing/CraftsmanshipSection').then(m => ({ default: m.CraftsmanshipSection })));
const TestimonialsSection = lazy(() => import('../components/landing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FaqSection = lazy(() => import('../components/landing/FaqSection').then(m => ({ default: m.FaqSection })));
const CtaSection = lazy(() => import('../components/landing/CtaSection').then(m => ({ default: m.CtaSection })));
const LandingFooter = lazy(() => import('../components/landing/LandingFooter').then(m => ({ default: m.LandingFooter })));

// Viewport-aware section loader guaranteeing 0 Cumulative Layout Shift (CLS = 0)
function LazyViewportSection({
  children,
  minHeight = '650px',
  id,
}: {
  children: React.ReactNode;
  minHeight?: string;
  id?: string;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px 0px 800px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div id={id} ref={containerRef} style={{ minHeight: shouldRender ? undefined : minHeight }} className="w-full">
      {shouldRender ? (
        <Suspense fallback={<div style={{ minHeight }} className="w-full" aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : (
        <div style={{ minHeight }} className="w-full" aria-hidden="true" />
      )}
    </div>
  );
}

// Pure GPU scroll progress indicator — 0 React re-renders, 0 hook overhead
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.getElementById('landing-scroll');
    const bar = barRef.current;
    if (!container || !bar) return;

    let ticking = false;
    const updateProgress = () => {
      const max = container.scrollHeight - container.clientHeight;
      const progress = max > 0 ? container.scrollTop / max : 0;
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left pointer-events-none will-change-transform"
      style={{
        transform: 'scaleX(0)',
        background: 'linear-gradient(to right, var(--color-primary), #fff0c0)',
      }}
    />
  );
}

// Orb-accented gold divider placed between each section with subtle diagonal drift
function GoldDivider({
  variant = 'polyhedron',
  side = 'left',
}: {
  variant?: 'polyhedron' | 'orb' | 'ring' | 'diamond' | 'helix' | 'star';
  side?: 'left' | 'right';
}) {
  return (
    <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center gap-6 overflow-visible">
      {/* Left orb — diagonal entrance and continuous rotation */}
      {side === 'left' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, x: -35, y: -20 }}
          whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          <ScrollOrb3D variant={variant} size={72} speed={0.9} />
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

      {/* Right orb — diagonal entrance and continuous rotation */}
      {side === 'right' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, x: 35, y: -20 }}
          whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          <ScrollOrb3D variant={variant} size={72} speed={0.9} />
        </motion.div>
      )}
    </div>
  );
}

export default function Landing() {
  const { services, shop, stats, loading } = useLandingData();
  const [show3D, setShow3D] = useState(false);

  // Progressive Activation: Initialize background 3D scenes after first paint
  useEffect(() => {
    const start3D = () => setShow3D(true);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(start3D, { timeout: 1500 });
    } else {
      setTimeout(start3D, 800);
    }
  }, []);

  return (
    <div className="relative h-full" style={{ background: 'var(--color-bg)' }}>
      {/* Background 3D canvases — deferred to Phase 2 for instant FCP & LCP */}
      {show3D && (
        <>
          <Suspense fallback={null}>
            <FloatingCanvas3D />
          </Suspense>
          <Suspense fallback={null}>
            <FloatingPolyhedronPath />
          </Suspense>
        </>
      )}

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
        {/* Phase 1: Critical Hero rendered immediately with 0 delay */}
        <HeroSection shop={shop} stats={stats} />

        {/* ── Section break: Polyhedron accent + right ── */}
        <GoldDivider variant="polyhedron" side="right" />

        {/* Phase 2: Atmosphere Section (Viewport-Loaded) */}
        <LazyViewportSection minHeight="720px" id="atmosphere">
          <AtmosphereSection stats={stats} />
        </LazyViewportSection>

        {/* ── Section break: Polyhedron accent + left ── */}
        <GoldDivider variant="polyhedron" side="left" />

        {/* Phase 2: Services Showcase (Viewport-Loaded) */}
        <LazyViewportSection minHeight="850px" id="services">
          <ServicesSection services={services} shop={shop} loading={loading} />
        </LazyViewportSection>

        {/* ── Section break: ring + right orb ── */}
        <GoldDivider variant="ring" side="right" />

        {/* Phase 2: Craftsmanship Protocol (Viewport-Loaded) */}
        <LazyViewportSection minHeight="720px" id="craftsmanship">
          <CraftsmanshipSection />
        </LazyViewportSection>

        {/* ── Section break: Polyhedron accent + left ── */}
        <GoldDivider variant="polyhedron" side="left" />

        {/* Phase 2: Client Reviews / Comments Marquee (Viewport-Loaded) */}
        <LazyViewportSection minHeight="650px" id="membership">
          <TestimonialsSection />
        </LazyViewportSection>

        {/* ── Section break: Polyhedron accent + right ── */}
        <GoldDivider variant="polyhedron" side="right" />

        {/* Phase 2: Client FAQ Accordion (Viewport-Loaded) */}
        <LazyViewportSection minHeight="600px" id="faq">
          <FaqSection />
        </LazyViewportSection>

        {/* ── Section break: Polyhedron accent + left ── */}
        <GoldDivider variant="polyhedron" side="left" />

        {/* Phase 2: Grand CTA Section (Viewport-Loaded) */}
        <LazyViewportSection minHeight="600px" id="reserve">
          <CtaSection shop={shop} />
        </LazyViewportSection>

        {/* Phase 2: Footer (Viewport-Loaded) */}
        <LazyViewportSection minHeight="500px" id="locations">
          <LandingFooter shop={shop} />
        </LazyViewportSection>
      </div>
    </div>
  );
}


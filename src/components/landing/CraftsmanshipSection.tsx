import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { MessageSquare, Sparkles, Palette, Coffee } from 'lucide-react';
import { ScrollOrb3D } from '../3d/ScrollOrb3D';

const STEPS = [
  {
    step: '01',
    icon: MessageSquare,
    title: 'Aesthetic Diagnosis',
    description:
      'Your Grand Master conducts a thorough lifestyle and aesthetic consultation — analysing facial geometry, hair texture, and personal style aspirations. A bespoke blueprint is drafted.',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Signature Treatment',
    description:
      'The chosen service is executed with surgical precision — every snip, stroke, and blade angle calculated. Proprietary organic formulas are selected to your profile.',
  },
  {
    step: '03',
    icon: Palette,
    title: 'Tailored Finishing',
    description:
      'The final composition is styled, textured, and refined to the millimetre. Your natural features are elevated, never overwhelmed. A looking-glass moment.',
  },
  {
    step: '04',
    icon: Coffee,
    title: 'VIP Lounge Refinement',
    description:
      'Post-service, retire to our private lounge. Single-malt, cold press, or a curated herbal infusion — your choice. A moment to savour your transformation.',
  },
];

export function CraftsmanshipSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="experience" ref={ref} className="relative py-24 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Large background text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <p
          className="font-brand text-[20vw] font-bold leading-none tracking-tighter opacity-[0.025] whitespace-nowrap"
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
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: 'var(--color-primary)' }}>
            The Aurelian Protocol
          </p>
          <h2 className="font-brand text-4xl sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-primary-text)' }}>
            The{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Craftsmanship
            </span>{' '}
            Journey
          </h2>
          <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            From the moment you arrive to the lingering effect of transformation — a four-act ceremony
            conducted exclusively for you.
          </p>
        </motion.div>

        {/* Steps — horizontal timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 relative">
          {/* Connecting line */}
          <div
            className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{ background: 'linear-gradient(to right, transparent, rgba(229,195,120,0.3), rgba(229,195,120,0.5), rgba(229,195,120,0.3), transparent)' }}
          />

          {STEPS.map(({ step, icon: Icon, title, description }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-6 lg:p-8 flex flex-col items-center text-center lg:items-start lg:text-left gap-5"
            >
              {/* Step circle */}
              <div className="relative z-10">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 relative"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'rgba(229,195,120,0.35)',
                    boxShadow: '0 0 20px rgba(229,195,120,0.1)',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--color-primary)' }} />

                  {/* Step number badge */}
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-brand text-[10px] font-bold"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  >
                    {i + 1}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Step {step}
                </p>
                <h3 className="font-brand text-lg" style={{ color: 'var(--color-primary-text)' }}>
                  {title}
                </h3>
                <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                  {description}
                </p>
              </div>

              {/* Vertical connector on mobile */}
              {i < STEPS.length - 1 && (
                <div
                  className="lg:hidden absolute bottom-0 left-1/2 w-px h-6"
                  style={{ background: 'rgba(229,195,120,0.2)' }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

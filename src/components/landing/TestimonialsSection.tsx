import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Marquee } from '../magicui/marquee';
import { Star } from 'lucide-react';
import { ScrollOrb3D } from '../3d/ScrollOrb3D';
import { useTheme } from '../../lib/theme';

const TESTIMONIALS = [
  {
    name: 'Julian Vance',
    handle: '@julianvance',
    role: 'Managing Partner',
    text: 'Aurelian has ruined every other barbershop for me. The private suite and the bespoke scalp ritual are transcendent.',
    stars: 5,
    avatar: 'JV',
  },
  {
    name: 'Dr. Marcus Webb',
    handle: '@mwebb_md',
    role: 'Neurosurgeon',
    text: 'Zero wait time. I arrive, my suite is ready, and my master stylist knows my exact specifications before I speak.',
    stars: 5,
    avatar: 'MW',
  },
  {
    name: 'Soren Lindqvist',
    handle: '@soren_l',
    role: 'Creative Director',
    text: 'The precision of their hot-towel shave is unmatched. You leave feeling restored, not just groomed.',
    stars: 5,
    avatar: 'SL',
  },
  {
    name: 'Ethan Cole',
    handle: '@ecole_arch',
    role: 'Principal Architect',
    text: 'The architectural design of the salon alone is inspiring. The haircut? World-class geometry.',
    stars: 5,
    avatar: 'EC',
  },
  {
    name: 'Lord Henry Sterling',
    handle: '@hsterling',
    role: 'Private Equity',
    text: 'Finally, an atelier that respects time and privacy. The single-malt selection and craft are peerless.',
    stars: 5,
    avatar: 'HS',
  },
  {
    name: 'Kai Takahashi',
    handle: '@kai_t',
    role: 'Venture Capitalist',
    text: 'Every visit is a masterclass in subtlety. You never look "freshly cut" — you just look impeccably refined.',
    stars: 5,
    avatar: 'KT',
  },
];

interface TestimonialCardProps {
  name: string;
  handle: string;
  role: string;
  text: string;
  stars: number;
  avatar: string;
}

function TestimonialCard({ name, handle, role, text, stars, avatar }: TestimonialCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className="w-72 sm:w-80 rounded-3xl border p-6 space-y-4 mx-3 shrink-0 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: isDark
          ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, rgba(16,14,10,0.85) 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
        borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
        boxShadow: isDark
          ? '10px 10px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)'
          : '8px 8px 24px rgba(190, 175, 145, 0.22), -8px -8px 24px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
      }}
    >
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} size={12} fill="currentColor" style={{ color: 'var(--color-primary)' }} />
        ))}
      </div>

      {/* Text */}
      <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-body-text)' }}>
        "{text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(229,195,120,0.12)' : 'rgba(196,151,42,0.15)' }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-brand text-sm font-bold shrink-0 backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(229,195,120,0.18)' : 'linear-gradient(135deg, #f0ebd8 0%, #ffffff 100%)',
            color: 'var(--color-primary)',
            border: isDark ? '1px solid rgba(229,195,120,0.3)' : '1px solid rgba(196,151,42,0.3)',
            boxShadow: isDark ? 'none' : 'inset 1px 1px 3px rgba(190,175,145,0.2)',
          }}
        >
          {avatar}
        </div>
        <div>
          <p className="font-sans text-xs font-semibold" style={{ color: 'var(--color-primary-text)' }}>
            {name}
          </p>
          <p className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
            {handle} · {role}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const half = Math.ceil(TESTIMONIALS.length / 2);
  const row1 = TESTIMONIALS.slice(0, half);
  const row2 = TESTIMONIALS.slice(half);

  return (
    <section id="membership" ref={ref} className="relative py-24 overflow-hidden">
      {/* 3D Polyhedron accents flanking the section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.1 }}
        className="absolute top-4 left-6 pointer-events-none hidden lg:block"
      >
        <ScrollOrb3D variant="polyhedron" size={120} speed={0.7} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.25 }}
        className="absolute top-4 right-6 pointer-events-none hidden lg:block"
      >
        <ScrollOrb3D variant="polyhedron" size={120} speed={0.55} />
      </motion.div>

      <div className="space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 px-6 sm:px-10"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: 'var(--color-primary)' }}>
            Client Accolades
          </p>
          <h2 className="font-brand text-4xl sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-primary-text)' }}>
            Voices of{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Excellence
            </span>
          </h2>
          <p className="font-sans text-sm max-w-xl mx-auto" style={{ color: 'var(--color-secondary-text)' }}>
            Thousands of discerning clients. One consistent story.
          </p>
        </motion.div>

        {/* Marquee Row 1 — left to right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Marquee pauseOnHover duration="45s">
            {row1.map((t, i) => (
              <div key={i}>
                <TestimonialCard
                  name={t.name}
                  handle={t.handle}
                  role={t.role}
                  text={t.text}
                  stars={t.stars}
                  avatar={t.avatar}
                />
              </div>
            ))}
          </Marquee>
        </motion.div>

        {/* Marquee Row 2 — right to left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <Marquee pauseOnHover reverse duration="40s">
            {row2.map((t, i) => (
              <div key={i}>
                <TestimonialCard
                  name={t.name}
                  handle={t.handle}
                  role={t.role}
                  text={t.text}
                  stars={t.stars}
                  avatar={t.avatar}
                />
              </div>
            ))}
          </Marquee>
        </motion.div>
      </div>
    </section>
  );
}

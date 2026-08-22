import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Marquee } from '../magicui/marquee';
import { Star } from 'lucide-react';
import { ScrollOrb3D } from '../3d/ScrollOrb3D';

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    handle: '@arjun.mehta',
    role: 'Founding Member',
    text: 'Aurelian is the only salon I will ever trust. The precision is unreal — I look sculpted, not just groomed. My go-to for every major event.',
    stars: 5,
    avatar: 'A',
  },
  {
    name: 'Rohan Iyer',
    handle: '@rohaniyer',
    role: 'Grand Prestige Member',
    text: 'The Royal Shave experience is a ritual I look forward to every month. Hot linen, cold press, a straight razor — pure theatre in the best way.',
    stars: 5,
    avatar: 'R',
  },
  {
    name: 'Vikram Sharma',
    handle: '@vsharma_exec',
    role: 'VIP Member',
    text: 'The booking system is flawless — I have never had a conflict, ever. And the barbers just understand what you want without needing a lecture.',
    stars: 5,
    avatar: 'V',
  },
  {
    name: 'Nikhil Banerjee',
    handle: '@nikb',
    role: 'Founding Member',
    text: 'Grand Luxe is worth every rupee. Three hours of complete indulgence. I left feeling like I owned the city.',
    stars: 5,
    avatar: 'N',
  },
  {
    name: 'Siddharth Rao',
    handle: '@siddrao',
    role: 'Prestige Monthly',
    text: 'The scalp therapy changed my life — not an exaggeration. My hair health has transformed in three months of consistent treatments here.',
    stars: 5,
    avatar: 'S',
  },
  {
    name: 'Kabir Desai',
    handle: '@kabirdsr',
    role: 'VIP Member',
    text: 'Understated luxury, exceptionally executed. Aurelian is a class above every other establishment in the city.',
    stars: 5,
    avatar: 'K',
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
  return (
    <div
      className="w-72 sm:w-80 rounded-2xl border p-6 space-y-4 mx-3 shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'rgba(229,195,120,0.12)',
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
      <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(229,195,120,0.08)' }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-brand text-sm font-bold shrink-0"
          style={{ background: 'rgba(229,195,120,0.15)', color: 'var(--color-primary)' }}
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

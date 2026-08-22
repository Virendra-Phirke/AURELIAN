import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { TiltCard3D } from '../3d/TiltCard3D';
import { Clock, ArrowRight } from 'lucide-react';

const CATEGORIES = ['All', 'Hair Architecture', 'Royal Shaving', 'Facial & Scalp', 'VIP Packages'] as const;
type Category = typeof CATEGORIES[number];

const SERVICES = [
  {
    name: 'Signature Cut & Style',
    category: 'Hair Architecture',
    duration: 60,
    price: '₹2,400',
    description: 'A bespoke hair architecture session. Consultation, precision cut, and signature finish.',
    badge: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Royal Hot Towel Shave',
    category: 'Royal Shaving',
    duration: 45,
    price: '₹1,800',
    description: 'Traditional straight-razor shave ritual with hot linen, oil pre-treatment, and artisanal balm.',
    badge: 'Heritage',
    highlight: false,
  },
  {
    name: 'Hair + Beard Mastery',
    category: 'Hair Architecture',
    duration: 90,
    price: '₹3,600',
    description: 'The complete grooming statement. Full precision cut paired with sculpted beard architecture.',
    badge: 'Premium',
    highlight: false,
  },
  {
    name: 'Scalp Revival Therapy',
    category: 'Facial & Scalp',
    duration: 50,
    price: '₹2,200',
    description: 'Deep-cleanse scalp detox with organic actives, hot compress, and revitalising scalp massage.',
    badge: 'Wellness',
    highlight: false,
  },
  {
    name: 'The Grand Luxe',
    category: 'VIP Packages',
    duration: 180,
    price: '₹8,500',
    description: 'The ultimate Aurelian experience: cut, shave, facial, scalp, VIP lounge, and curated refreshment.',
    badge: 'VIP',
    highlight: true,
  },
  {
    name: 'Beard Shaping & Oil Ritual',
    category: 'Royal Shaving',
    duration: 40,
    price: '₹1,400',
    description: 'Surgical beard sculpting with contour mapping and a Moroccan argan nourishing ritual finish.',
    badge: 'Classic',
    highlight: false,
  },
  {
    name: 'Brightening Facial',
    category: 'Facial & Scalp',
    duration: 55,
    price: '₹2,600',
    description: 'Multi-step rejuvenating facial with vitamin C infusion, lymphatic drainage, and LED finishing.',
    badge: 'Glow',
    highlight: false,
  },
  {
    name: 'Prestige Monthly',
    category: 'VIP Packages',
    duration: 120,
    price: '₹5,800',
    description: 'Monthly retainer: unlimited styling touch-ups, priority slots, and complimentary beard maintenance.',
    badge: 'Members',
    highlight: false,
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ServicesSection() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const filtered = activeCategory === 'All'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeCategory);

  return (
    <section id="services" ref={ref} className="relative py-24 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: 'var(--color-primary)' }}>
            The Bespoke Atelier
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-brand text-4xl sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-primary-text)' }}>
              Our{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #fff0c0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Services
              </span>
            </h2>
            <Link
              to="/booking"
              className="hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Book Now <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap gap-2"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="font-sans text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer"
              style={{
                background: activeCategory === cat ? 'var(--color-primary)' : 'transparent',
                color: activeCategory === cat ? 'var(--color-bg)' : 'var(--color-secondary-text)',
                borderColor: activeCategory === cat ? 'var(--color-primary)' : 'rgba(229,195,120,0.2)',
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((service, i) => (
            <motion.div
              key={service.name}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <TiltCard3D
                className="h-full rounded-2xl border flex flex-col"
                style={{
                  background: service.highlight
                    ? 'linear-gradient(160deg, rgba(229,195,120,0.1) 0%, var(--color-surface) 60%)'
                    : 'var(--color-surface)',
                  borderColor: service.highlight ? 'rgba(229,195,120,0.25)' : 'rgba(229,195,120,0.08)',
                }}
              >
                <div className="flex flex-col h-full p-5 space-y-4">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sans text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border"
                      style={{
                        color: service.highlight ? 'var(--color-bg)' : 'var(--color-primary)',
                        background: service.highlight ? 'var(--color-primary)' : 'rgba(229,195,120,0.08)',
                        borderColor: 'rgba(229,195,120,0.2)',
                      }}
                    >
                      {service.badge}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-muted-text)' }}>
                      {service.category}
                    </span>
                  </div>

                  {/* Service name */}
                  <h3 className="font-brand text-lg leading-tight" style={{ color: 'var(--color-primary-text)' }}>
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p className="font-sans text-xs leading-relaxed flex-1" style={{ color: 'var(--color-secondary-text)' }}>
                    {service.description}
                  </p>

                  {/* Footer */}
                  <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'rgba(229,195,120,0.1)' }}>
                    <div>
                      <p className="font-brand text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                        {service.price}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} style={{ color: 'var(--color-muted-text)' }} />
                        <span className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/booking"
                      className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full transition-all duration-200"
                      style={{
                        background: service.highlight ? 'var(--color-primary)' : 'rgba(229,195,120,0.1)',
                        color: service.highlight ? 'var(--color-bg)' : 'var(--color-primary)',
                        border: '1px solid rgba(229,195,120,0.2)',
                      }}
                    >
                      Book <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </TiltCard3D>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

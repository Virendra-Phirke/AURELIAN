import React, { useRef, useState, useMemo } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { TiltCard3D } from '../3d/TiltCard3D';
import { Clock, ArrowRight, Scissors } from 'lucide-react';
import { ServiceItem, ShopSettings } from '../../lib/useLandingData';

interface ServicesSectionProps {
  services?: ServiceItem[];
  shop?: ShopSettings;
  loading?: boolean;
}

function getCategoryForService(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('shav') || lower.includes('beard')) return 'Royal Shaving';
  if (lower.includes('cut') || lower.includes('hair') || lower.includes('style')) return 'Hair Architecture';
  if (lower.includes('scalp') || lower.includes('facial') || lower.includes('therapy')) return 'Facial & Scalp';
  if (lower.includes('luxe') || lower.includes('package') || lower.includes('vip')) return 'VIP Packages';
  return 'Bespoke';
}

function getBadgeForService(index: number, name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('luxe') || lower.includes('grand')) return 'VIP Luxe';
  if (lower.includes('signature') || index === 0) return 'Signature';
  if (lower.includes('royal') || lower.includes('heritage')) return 'Heritage';
  if (lower.includes('beard')) return 'Precision';
  if (lower.includes('scalp')) return 'Wellness';
  return 'Artisanal';
}

function getDescriptionForService(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('cut') && lower.includes('beard')) {
    return 'The complete grooming statement. Full precision haircut paired with tailored beard contouring.';
  }
  if (lower.includes('cut') || lower.includes('style')) {
    return 'A bespoke hair architecture session. Morphological consultation, precision scissor work, and signature finish.';
  }
  if (lower.includes('shav')) {
    return 'Traditional straight-razor shave ritual with hot linen, essential oil pre-treatment, and soothing organic balm.';
  }
  if (lower.includes('beard')) {
    return 'Surgical beard sculpting with contour mapping and a nourishing Moroccan argan conditioning finish.';
  }
  if (lower.includes('scalp') || lower.includes('facial')) {
    return 'Deep revitalising scalp and facial therapy with pure phyto-active serums and restorative massage.';
  }
  if (lower.includes('luxe') || lower.includes('grand')) {
    return 'The ultimate private suite experience: signature styling, royal shave, revitalising treatment, and lounge access.';
  }
  return 'Handcrafted luxury grooming experience tailored precisely to your facial geometry and personal style.';
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ServicesSection({ services: propServices, shop, loading }: ServicesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const activeServices = useMemo(() => {
    if (propServices && propServices.length > 0) {
      return propServices.filter(s => s.active !== false);
    }
    return [];
  }, [propServices]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    activeServices.forEach(s => set.add(getCategoryForService(s.name)));
    return Array.from(set);
  }, [activeServices]);

  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return activeServices;
    return activeServices.filter(s => getCategoryForService(s.name) === activeCategory);
  }, [activeServices, activeCategory]);

  const currency = shop?.currencySymbol && shop.currencySymbol !== '?' ? shop.currencySymbol : '$';

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
                Signature Services
              </span>
            </h2>
            <Link
              to="/booking"
              className="hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Book an Experience <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="font-sans text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border backdrop-blur-lg transition-all duration-200 cursor-pointer"
                style={{
                  background: activeCategory === cat ? 'var(--color-primary)' : 'rgba(14,12,8,0.65)',
                  color: activeCategory === cat ? 'var(--color-bg)' : 'var(--color-secondary-text)',
                  borderColor: activeCategory === cat ? 'var(--color-primary)' : 'rgba(229,195,120,0.2)',
                  boxShadow: activeCategory === cat ? '0 4px 20px rgba(229,195,120,0.3)' : 'inset 0 1px 1px rgba(255,255,255,0.06)',
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* Services Grid with Real Database Records */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3 rounded-2xl border backdrop-blur-xl" style={{ borderColor: 'rgba(229,195,120,0.18)', background: 'rgba(14,12,8,0.72)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 16px 40px rgba(0,0,0,0.4)' }}>
            <Scissors size={28} className="mx-auto" style={{ color: 'var(--color-primary)' }} />
            <p className="font-brand text-lg" style={{ color: 'var(--color-primary-text)' }}>
              {loading ? 'Curating Signature Services...' : 'Services Currently Being Prepared'}
            </p>
            <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>
              Please check back shortly or explore our bespoke booking options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((service, i) => {
            const categoryName = getCategoryForService(service.name);
            const badgeName = getBadgeForService(i, service.name);
            const description = getDescriptionForService(service.name);
            const isHighlight = i === 0 || service.name.toLowerCase().includes('luxe');

            return (
              <motion.div
                key={service.id || service.name}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                <TiltCard3D
                  className="h-full rounded-2xl border flex flex-col backdrop-blur-xl"
                  style={{
                    background: isHighlight
                      ? 'linear-gradient(160deg, rgba(229,195,120,0.12) 0%, rgba(14,12,8,0.75) 60%)'
                      : 'linear-gradient(160deg, rgba(229,195,120,0.04) 0%, rgba(14,12,8,0.72) 100%)',
                    borderColor: isHighlight ? 'rgba(229,195,120,0.28)' : 'rgba(229,195,120,0.14)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="flex flex-col h-full p-5 space-y-4">
                    {/* Badge & Category */}
                    <div className="flex items-center justify-between">
                      <span
                        className="font-sans text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          color: isHighlight ? 'var(--color-bg)' : 'var(--color-primary)',
                          background: isHighlight ? 'var(--color-primary)' : 'rgba(229,195,120,0.08)',
                          borderColor: 'rgba(229,195,120,0.2)',
                        }}
                      >
                        {badgeName}
                      </span>
                      <span className="font-sans text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-muted-text)' }}>
                        {categoryName}
                      </span>
                    </div>

                    {/* Service Name */}
                    <h3 className="font-brand text-lg leading-tight" style={{ color: 'var(--color-primary-text)' }}>
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="font-sans text-xs leading-relaxed flex-1" style={{ color: 'var(--color-secondary-text)' }}>
                      {description}
                    </p>

                    {/* Footer: Price + Duration + 1-Click Booking */}
                    <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'rgba(229,195,120,0.1)' }}>
                      <div>
                        <p className="font-brand text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                          {currency}
                          {Number(service.price).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={10} style={{ color: 'var(--color-muted-text)' }} />
                          <span className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
                            {service.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/booking`}
                        className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
                        style={{
                          background: isHighlight ? 'var(--color-primary)' : 'rgba(229,195,120,0.1)',
                          color: isHighlight ? 'var(--color-bg)' : 'var(--color-primary)',
                          border: '1px solid rgba(229,195,120,0.25)',
                        }}
                      >
                        Book <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                </TiltCard3D>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}

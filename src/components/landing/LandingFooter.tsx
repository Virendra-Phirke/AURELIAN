import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Check, ArrowRight, Sparkles } from 'lucide-react';
import { ShopSettings } from '../../lib/useLandingData';
import { useTheme } from '../../lib/theme';

interface LandingFooterProps {
  shop?: ShopSettings | null;
}

export function LandingFooter({ shop }: LandingFooterProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const brandName = shop?.shopName || 'AURELIAN';
  const tagline = shop?.shopTagline || 'Haute Coiffure & Private Grooming Sanctuary';
  const phone = shop?.phone || '+1 (555) 234-5678';
  const email = shop?.email || 'concierge@aureliansalon.com';
  const address = shop?.address || '123 Luxury Ave, Beverly Hills, CA';
  const openingTime = shop?.openingTime || '09:00';
  const closingTime = shop?.closingTime || '20:00';
  const hours = `${openingTime} – ${closingTime}`;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const container = document.getElementById('landing-scroll');
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <footer id="locations" className="relative border-t transition-colors duration-300" style={{ borderColor: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.18)', background: 'var(--color-bg)' }}>
      {/* Ambient background glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-64 pointer-events-none opacity-20"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at bottom, rgba(229,195,120,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at bottom, rgba(196,151,42,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 space-y-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="space-y-5 lg:col-span-2">
            <Link
              to="/"
              className="text-2xl font-brand tracking-[0.35em] font-semibold uppercase block"
              style={{ color: 'var(--color-primary)' }}
            >
              ⚜ {brandName}
            </Link>
            <p className="font-sans text-xs max-w-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
              {tagline}
            </p>

            {/* VIP Dispatch Newsletter */}
            <div className="space-y-2.5 pt-1">
              <p className="font-sans text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-primary)' }}>
                <Sparkles size={11} /> The Atelier Private Journal
              </p>
              <p className="font-sans text-[11px]" style={{ color: 'var(--color-muted-text)' }}>
                Receive private release notices and seasonal formulation previews.
              </p>
              <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full text-xs font-sans border outline-none transition-all duration-200"
                  style={{
                    background: isDark ? 'rgba(16,14,10,0.8)' : '#ffffff',
                    borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)',
                    color: 'var(--color-primary-text)',
                  }}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full font-sans text-[10px] uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer shadow-md"
                  style={{
                    background: isDark ? 'var(--color-primary)' : 'linear-gradient(135deg, #b8860b 0%, #996515 100%)',
                    color: isDark ? '#060606' : '#ffffff',
                  }}
                >
                  {subscribed ? <Check size={14} className="mx-auto" /> : 'Join'}
                </button>
              </form>
              {subscribed && (
                <p className="font-sans text-[10px] text-emerald-400">
                  ✓ Welcome to the Aurelian Private Circle.
                </p>
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div className="space-y-4">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Navigation
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Philosophy', id: 'atmosphere' },
                { label: 'Signature Services', id: 'services' },
                { label: 'Four-Act Protocol', id: 'craftsmanship' },
                { label: 'Patron Reviews', id: 'membership' },
                { label: 'Client FAQ', id: 'faq' },
                { label: 'Reserve Appointment', id: 'reserve' },
              ].map(({ label, id }) => (
                <li key={label}>
                  <button
                    onClick={() => scrollTo(id)}
                    className="font-sans text-xs transition-colors duration-200 cursor-pointer"
                    style={{ color: 'var(--color-secondary-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary-text)')}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Salon Flagship Details from Database */}
          <div className="space-y-4 lg:col-span-2">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Concierge &amp; Flagship Atelier
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Address & Hours */}
              <div
                className="space-y-3 p-5 rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
                  background: isDark
                    ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, rgba(16,14,10,0.85) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                  boxShadow: isDark
                    ? '10px 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)'
                    : '6px 6px 18px rgba(190, 175, 145, 0.2), -6px -6px 18px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
                }}
              >
                <div>
                  <p className="font-brand text-sm font-semibold" style={{ color: 'var(--color-primary-text)' }}>{brandName} Flagship</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>Private Atelier</p>
                </div>
                <div className="space-y-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 group transition-colors"
                  >
                    <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs leading-relaxed group-hover:underline" style={{ color: 'var(--color-secondary-text)' }}>
                      {address} ↗
                    </p>
                  </a>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>Mon–Sat · {hours}</p>
                  </div>
                </div>
              </div>

              {/* Direct Concierge Contact */}
              <div
                className="space-y-3 p-5 rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
                  background: isDark
                    ? 'linear-gradient(160deg, rgba(229,195,120,0.06) 0%, rgba(16,14,10,0.85) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                  boxShadow: isDark
                    ? '10px 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)'
                    : '6px 6px 18px rgba(190, 175, 145, 0.2), -6px -6px 18px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
                }}
              >
                <div>
                  <p className="font-brand text-sm font-semibold" style={{ color: 'var(--color-primary-text)' }}>Concierge Desk</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>Direct Line</p>
                </div>
                <div className="space-y-2">
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2 group transition-colors"
                  >
                    <Phone size={13} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs group-hover:underline" style={{ color: 'var(--color-secondary-text)' }}>{phone}</p>
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 group transition-colors"
                  >
                    <Mail size={13} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs group-hover:underline" style={{ color: 'var(--color-secondary-text)' }}>{email}</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
          style={{ borderColor: isDark ? 'rgba(229,195,120,0.08)' : 'rgba(196,151,42,0.12)' }}
        >
          <p className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            {[
              { label: 'Privacy Policy', to: '/privacy-policy' },
              { label: 'Terms of Service', to: '/terms' },
              { label: 'Cancellation Policy', to: '/cancellation-policy' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="font-sans text-[10px] transition-colors duration-200"
                style={{ color: 'var(--color-muted-text)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted-text)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;


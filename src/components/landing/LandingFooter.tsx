import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, ExternalLink, Share2 } from 'lucide-react';
import { ShopSettings } from '../../lib/useLandingData';

interface LandingFooterProps {
  shop?: ShopSettings;
}

const NAV_LINKS = [
  { label: 'Signature Services', href: '#services' },
  { label: 'The Experience', href: '#experience' },
  { label: 'Client Reviews', href: '#membership' },
  { label: 'Reserve Online', href: '/booking' },
  { label: 'Client Dashboard', href: '/dashboard' },
  { label: 'Sign In / Register', href: '/login' },
];

export function LandingFooter({ shop }: LandingFooterProps) {
  const brandName = shop?.shopName || 'AURELIAN';
  const hours = `${shop?.openingTime || '09:00'} – ${shop?.closingTime || '20:00'}`;
  const address = shop?.address || '14 Mayfair Atelier, London / DIFC Dubai / Beverly Hills';
  const phone = shop?.phone || '+1 (555) 234-5678';
  const email = shop?.email || 'concierge@aureliansalon.com';

  return (
    <footer id="locations" className="relative border-t" style={{ borderColor: 'rgba(229,195,120,0.1)', background: 'var(--color-sidebar-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 space-y-12">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link
              to="/"
              className="text-2xl font-brand tracking-[0.35em] font-semibold uppercase"
              style={{ color: 'var(--color-primary)' }}
            >
              ⚜ {brandName}
            </Link>
            <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
              {shop?.shopTagline || 'Luxury salon and bespoke grooming platform. Precision, craft, and exclusivity.'}
            </p>
            <div className="flex gap-3">
              {[Share2, ExternalLink].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors duration-200 cursor-pointer"
                  style={{
                    borderColor: 'rgba(229,195,120,0.2)',
                    color: 'var(--color-secondary-text)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,195,120,0.5)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-secondary-text)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,195,120,0.2)';
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Navigation
            </p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    to={href.startsWith('#') ? '/' : href}
                    onClick={() => {
                      if (href.startsWith('#')) {
                        const el = document.getElementById(href.replace('#', ''));
                        const c = document.getElementById('landing-scroll');
                        if (el && c) c.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                      }
                    }}
                    className="font-sans text-xs transition-colors duration-200"
                    style={{ color: 'var(--color-secondary-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary-text)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Salon Flagship Details from Database */}
          <div className="space-y-5 lg:col-span-2">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Concierge &amp; Flagship Atelier
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Primary Address & Hours */}
              <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'rgba(229,195,120,0.1)', background: 'rgba(229,195,120,0.02)' }}>
                <div>
                  <p className="font-brand text-sm font-semibold" style={{ color: 'var(--color-primary-text)' }}>{brandName} Flagship</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>Private Atelier</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>{address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>Mon–Sat · {hours}</p>
                  </div>
                </div>
              </div>

              {/* Direct Concierge Contact */}
              <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'rgba(229,195,120,0.1)', background: 'rgba(229,195,120,0.02)' }}>
                <div>
                  <p className="font-brand text-sm font-semibold" style={{ color: 'var(--color-primary-text)' }}>Concierge Desk</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>Direct Line</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>{phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="font-sans text-xs" style={{ color: 'var(--color-secondary-text)' }}>{email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
          style={{ borderColor: 'rgba(229,195,120,0.08)' }}
        >
          <p className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cancellation Policy'].map(label => (
              <Link
                key={label}
                to="/"
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

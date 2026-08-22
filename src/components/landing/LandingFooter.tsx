import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ExternalLink, Share2 } from 'lucide-react';

const LOCATIONS = [
  {
    city: 'Mumbai',
    district: 'Bandra West',
    address: '14 Chapel Road, Bandra West, Mumbai 400050',
    phone: '+91 98765 43210',
    hours: 'Mon–Sat · 10:00 – 20:00',
  },
  {
    city: 'Delhi',
    district: 'Connaught Place',
    address: 'Unit 4B, Outer Circle, Connaught Place, New Delhi 110001',
    phone: '+91 91234 56789',
    hours: 'Mon–Sat · 10:00 – 20:00',
  },
  {
    city: 'Bengaluru',
    district: 'Indiranagar',
    address: '72, 12th Main Road, Indiranagar, Bengaluru 560038',
    phone: '+91 98888 12345',
    hours: 'Mon–Sat · 10:00 – 20:00',
  },
];

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Experience', href: '#experience' },
  { label: 'Book an Appointment', href: '/booking' },
  { label: 'Client Portal', href: '/dashboard' },
  { label: 'Sign In', href: '/login' },
  { label: 'Register', href: '/register' },
];

export function LandingFooter() {
  return (
    <footer id="locations" className="relative border-t" style={{ borderColor: 'rgba(229,195,120,0.1)', background: 'var(--color-sidebar-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 space-y-12">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link
              to="/"
              className="text-2xl font-brand tracking-[0.4em] font-semibold uppercase"
              style={{ color: 'var(--color-primary)' }}
            >
              ⚜ AURELIAN
            </Link>
            <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
              Luxury salon and bespoke grooming platform. Precision, craft, and exclusivity — in three cities.
            </p>
            <div className="flex gap-3">
              {[Share2, ExternalLink].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors duration-200"
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
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Navigate
            </p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    to={href}
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

          {/* Locations */}
          <div className="space-y-5 lg:col-span-2">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--color-primary)' }}>
              Flagship Locations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {LOCATIONS.map(({ city, district, address, phone, hours }) => (
                <div key={city} className="space-y-2.5">
                  <div>
                    <p className="font-brand text-sm font-semibold" style={{ color: 'var(--color-primary-text)' }}>{city}</p>
                    <p className="font-sans text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>{district}</p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { icon: MapPin, text: address },
                      { icon: Phone, text: phone },
                      { icon: Clock, text: hours },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-1.5">
                        <Icon size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                        <p className="font-sans text-[10px] leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
          style={{ borderColor: 'rgba(229,195,120,0.08)' }}
        >
          <p className="font-sans text-[10px]" style={{ color: 'var(--color-muted-text)' }}>
            © {new Date().getFullYear()} Aurelian Salon. All rights reserved.
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

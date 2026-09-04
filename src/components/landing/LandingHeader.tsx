import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../magicui/theme-toggle';
import { ShopSettings } from '../../lib/useLandingData';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../../lib/theme';

const NAV_LINKS = [
  { label: 'Philosophy', href: '#atmosphere' },
  { label: 'Services', href: '#services' },
  { label: 'Ritual', href: '#craftsmanship' },
  { label: 'Reviews', href: '#membership' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Sanctuary', href: '#locations' },
];

interface LandingHeaderProps {
  shop?: ShopSettings;
}

export function LandingHeader({ shop }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Dynamically check session on idle to completely remove better-auth from critical landing path
    const checkSession = async () => {
      try {
        const { authClient } = await import('../../lib/auth');
        const res = await (authClient as any).getSession();
        if (res?.data) {
          setSession(res.data);
        }
      } catch {}
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(checkSession, { timeout: 6500 });
    } else {
      setTimeout(checkSession, 6000);
    }
  }, []);

  useEffect(() => {
    const container = document.getElementById('landing-scroll');
    const handleScroll = () => {
      const top = container ? container.scrollTop : window.scrollY;
      setScrolled(top > 40);
    };
    if (container) container.addEventListener('scroll', handleScroll);
    else window.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
      else window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const container = document.getElementById('landing-scroll');
      if (container) {
        container.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setMobileOpen(false);
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const brandName = shop?.shopName || 'AURELIAN';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        animation: 'header-slide-down 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        background: scrolled
          ? (isDark ? 'rgba(6,6,6,0.88)' : 'rgba(248,246,240,0.92)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? (isDark ? '1px solid rgba(229,195,120,0.12)' : '1px solid rgba(196,151,42,0.2)')
          : 'none',
        boxShadow: scrolled
          ? (isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(190,175,145,0.18)')
          : 'none',
      }}
    >
      {/* Active Announcement Banner from DB */}
      {shop?.announcementActive && shop?.announcementText && (
        <div
          className="px-4 py-1.5 text-center flex items-center justify-center gap-2 text-[11px] font-sans font-medium tracking-wide"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, rgba(229,195,120,0.2) 0%, rgba(229,195,120,0.35) 50%, rgba(229,195,120,0.2) 100%)'
              : 'linear-gradient(90deg, rgba(184,134,11,0.15) 0%, rgba(184,134,11,0.25) 50%, rgba(184,134,11,0.15) 100%)',
            color: 'var(--color-primary)',
            borderBottom: isDark ? '1px solid rgba(229,195,120,0.2)' : '1px solid rgba(196,151,42,0.25)',
          }}
        >
          <Sparkles size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
          <span>{shop.announcementText}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-brand tracking-[0.35em] font-semibold uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          ⚜ {brandName}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={href}
              onClick={() => scrollToSection(href)}
              className="font-sans text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={{ color: 'var(--color-secondary-text)', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary-text)')}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <button
              onClick={() => navigate(session.user.role === 'ADMIN' ? '/admin' : '/booking')}
              className="hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-md"
              style={{
                color: isDark ? '#060606' : '#ffffff',
                background: isDark
                  ? 'var(--color-primary)'
                  : 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                boxShadow: isDark
                  ? '0 4px 16px rgba(229,195,120,0.3)'
                  : '3px 3px 10px rgba(184,134,11,0.35), -2px -2px 8px rgba(255,255,255,0.9)',
              }}
            >
              My Portal
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex font-sans text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full border transition-all duration-200"
                style={{
                  color: 'var(--color-primary)',
                  borderColor: isDark ? 'rgba(229,195,120,0.3)' : 'rgba(196,151,42,0.3)',
                  background: isDark ? 'transparent' : 'rgba(255,255,255,0.6)',
                  boxShadow: isDark ? 'none' : '2px 2px 6px rgba(190,175,145,0.15), -2px -2px 6px rgba(255,255,255,0.9)',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/booking"
                className="inline-flex font-sans text-xs uppercase tracking-widest font-bold px-6 py-2.5 rounded-full transition-all duration-200 shadow-md cursor-pointer hover:scale-105"
                style={{
                  color: isDark ? '#060606' : '#ffffff',
                  background: isDark
                    ? 'linear-gradient(135deg, #e5c378 0%, #c4972a 100%)'
                    : 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                  boxShadow: isDark
                    ? '0 4px 16px rgba(229,195,120,0.35)'
                    : '4px 4px 12px rgba(184,134,11,0.35), -2px -2px 8px rgba(255,255,255,0.9)',
                }}
              >
                Reserve
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1.5 cursor-pointer"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menu"
          >
            <span className="block w-5 h-px" style={{ background: 'var(--color-primary)' }} />
            <span className="block w-4 h-px ml-auto" style={{ background: 'var(--color-primary)' }} />
            <span className="block w-5 h-px" style={{ background: 'var(--color-primary)' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            animation: 'dropdown-fade-in 0.2s ease-out both',
            background: isDark ? 'rgba(6,6,6,0.97)' : 'rgba(248,246,240,0.97)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.2)',
          }}
        >
          <div className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => scrollToSection(href)}
                className="font-sans text-xs uppercase tracking-widest text-left cursor-pointer"
                style={{ color: 'var(--color-secondary-text)', fontWeight: 600 }}
              >
                {label}
              </button>
            ))}
            {!session?.user ? (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="font-sans text-xs uppercase tracking-widest font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                Sign In
              </Link>
            ) : (
              <Link
                to={session.user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                onClick={() => setMobileOpen(false)}
                className="font-sans text-xs uppercase tracking-widest font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

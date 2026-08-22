import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ThemeToggle } from '../magicui/theme-toggle';
import { authClient } from '../../lib/auth';

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Experience', href: '#experience' },
  { label: 'Membership', href: '#membership' },
  { label: 'Locations', href: '#locations' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: sessionData } = authClient.useSession();
  const session = sessionData as any;
  const navigate = useNavigate();

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

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(6,6,6,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(229,195,120,0.1)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-brand tracking-[0.4em] font-semibold uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          ⚜ AURELIAN
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
              className="hidden sm:inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full border transition-all duration-200 cursor-pointer"
              style={{
                color: 'var(--color-bg)',
                background: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
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
                  borderColor: 'rgba(229,195,120,0.3)',
                  background: 'transparent',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex font-sans text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full transition-all duration-200"
                style={{
                  color: 'var(--color-bg)',
                  background: 'var(--color-primary)',
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t"
          style={{
            background: 'rgba(6,6,6,0.97)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(229,195,120,0.1)',
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
            {!session?.user && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="font-sans text-xs uppercase tracking-widest font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

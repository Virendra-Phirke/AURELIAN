import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, LogIn, Shield, Settings, User } from 'lucide-react';
import { authClient } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Particles } from './magicui/particles';
import { ThemeToggle } from './magicui/theme-toggle';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function Layout() {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData as any;
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = AUTH_PAGES.some(p => location.pathname.startsWith(p));
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await authClient.signOut({});
    navigate('/login');
  };

  // Auth pages get a clean minimal layout (no header/nav chrome)
  if (isAuthPage) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-bg)] overflow-y-auto">
        <header className="shrink-0 h-16 sm:h-20 border-b border-[var(--color-border)] px-6 sm:px-12 flex items-center justify-between bg-[var(--color-sidebar-bg)]">
          <Link to="/" className="text-xl sm:text-2xl tracking-[0.3em] font-semibold text-[var(--color-primary)] uppercase font-brand">
            AURELIAN
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    );
  }

  // Admin page gets its own full-height layout (no max-width constraint)
  if (isAdminPage) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-bg)] overflow-hidden">
        {/* Admin Header */}
        <header className="shrink-0 h-16 sm:h-20 border-b border-[var(--color-border)] px-6 sm:px-12 flex items-center justify-between z-20 bg-[var(--color-sidebar-bg)]">
          <Link to="/" className="text-xl sm:text-2xl tracking-[0.3em] font-semibold text-[var(--color-primary)] uppercase font-brand">
            AURELIAN
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-[var(--color-primary)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full font-semibold">
              <Shield size={12} className="text-[var(--color-primary)]" /> Admin
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline font-semibold">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  // Regular user pages — PC: Sidebar, Mobile: Top Header + Bottom Nav
  return (
    <div className="relative flex h-full bg-[var(--color-bg)] text-[var(--color-body-text)] overflow-hidden flex-col md:flex-row transition-colors duration-300">
      <Particles className="pointer-events-none opacity-25 fixed inset-0 z-0" quantity={35} color="var(--color-primary)" />

      {/* Mobile Top Header */}
      <header className="md:hidden shrink-0 h-14 px-4 flex items-center justify-between z-50 bg-[var(--color-sidebar-bg)] sticky top-0 transition-colors">
        <Link to="/" className="text-base sm:text-lg tracking-[0.25em] font-semibold text-[var(--color-primary)] uppercase font-brand">
          AURELIAN
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {session?.user && (
            <button onClick={handleLogout} className="text-[var(--color-secondary-text)] hover:text-[var(--color-primary)] transition-colors p-1.5 cursor-pointer" aria-label="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex shrink-0 w-60 lg:w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar-bg)] z-20 transition-colors"
      >
        <div className="h-16 sm:h-20 flex items-center px-5 sm:px-6 border-b border-[var(--color-border)] shrink-0">
          <Link to="/" className="text-xl sm:text-2xl tracking-[0.3em] font-brand font-semibold text-[var(--color-primary)] uppercase">
            AURELIAN
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-1.5 p-3.5 sm:p-4 overflow-y-auto">
          {isPending ? (
            <div className="space-y-2 py-1">
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
              <Skeleton className="w-full h-10 rounded-xl" />
            </div>
          ) : session?.user ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  location.pathname === '/dashboard'
                    ? 'border-l-[3px] border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                    : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] border-l-[3px] border-transparent font-medium'
                }`}
              >
                <LayoutDashboard size={16} className={location.pathname === '/dashboard' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'} />
                <span className="font-sans text-[11px] uppercase tracking-wider">Dashboard</span>
              </Link>
              <Link
                to="/booking"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  location.pathname === '/booking'
                    ? 'border-l-[3px] border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                    : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] border-l-[3px] border-transparent font-medium'
                }`}
              >
                <CalendarDays size={16} className={location.pathname === '/booking' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'} />
                <span className="font-sans text-[11px] uppercase tracking-wider">Book</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  location.pathname === '/settings'
                    ? 'border-l-[3px] border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                    : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] border-l-[3px] border-transparent font-medium'
                }`}
              >
                <Settings size={16} className={location.pathname === '/settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'} />
                <span className="font-sans text-[11px] uppercase tracking-wider">Settings</span>
              </Link>

              {session.user.role === 'ADMIN' && (
                <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-sans text-[11px] uppercase tracking-wider font-semibold border border-[var(--color-primary)]/20"
                  >
                    <Shield size={16} />
                    <span>Admin Panel</span>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-raised)] border-l-[3px] border-transparent transition-colors font-medium">
              <LogIn size={16} />
              <span className="font-sans text-[11px] uppercase tracking-wider">Sign In</span>
            </Link>
          )}
        </nav>
        {isPending ? (
          <div className="p-3.5 border-t border-[var(--color-border)] shrink-0 flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-28 h-2.5 rounded-md" />
            </div>
          </div>
        ) : session?.user ? (
          <div className="p-3.5 border-t border-[var(--color-border)] shrink-0 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--color-surface-raised)]/60 border border-[var(--color-border)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={15} className="text-[var(--color-primary)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[var(--color-primary-text)] truncate">
                  {session.user.name || 'Client'}
                </div>
                <div className="text-[10px] text-[var(--color-secondary-text)] truncate font-sans">
                  {session.user.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full">
              <ThemeToggle className="shrink-0" />
              <button
                onClick={handleLogout}
                className="flex-1 py-1.5 px-3 rounded-lg text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary)]/40 border border-[var(--color-border)] bg-[var(--color-surface-raised)] font-sans text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer text-center"
              >
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-20 md:pb-0">
        <div className="w-full px-3.5 sm:px-8 md:px-12 py-4 sm:py-10 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--color-sidebar-bg)] z-50 flex items-center justify-around px-2 pb-1 shadow-lg border-t border-[var(--color-border)]">
        {isPending ? (
          <div className="flex items-center justify-around w-full h-full px-4 gap-4">
            <Skeleton className="flex-1 h-8 rounded-lg" />
            <Skeleton className="flex-1 h-8 rounded-lg" />
            <Skeleton className="flex-1 h-8 rounded-lg" />
          </div>
        ) : session?.user ? (
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname === '/dashboard' ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]'
                }`}
            >
              <LayoutDashboard size={18} />
              <span className="font-sans text-[9px] uppercase tracking-wider">Dashboard</span>
            </Link>
            <Link
              to="/booking"
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname === '/booking' ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]'
                }`}
            >
              <CalendarDays size={18} />
              <span className="font-sans text-[9px] uppercase tracking-wider">Book</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname === '/settings' ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]'
                }`}
            >
              <Settings size={18} />
              <span className="font-sans text-[9px] uppercase tracking-wider">Settings</span>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]"
          >
            <LogIn size={18} />
            <span className="font-sans text-[9px] uppercase tracking-wider">Sign In</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

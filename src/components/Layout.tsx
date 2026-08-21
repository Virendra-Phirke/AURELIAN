import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, LogIn, Shield, Settings, User } from 'lucide-react';
import { authClient } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function Layout() {
  const { data: sessionData } = authClient.useSession();
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
        <header className="shrink-0 h-16 sm:h-20 border-b border-[var(--color-border)] px-6 sm:px-12 flex items-center">
          <Link to="/" className="text-xl sm:text-2xl tracking-[0.3em] font-light text-white uppercase">
            AURELIAN
          </Link>
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
        <header className="shrink-0 h-16 sm:h-20 border-b border-[var(--color-border)] px-6 sm:px-12 flex items-center justify-between z-20">
          <Link to="/" className="text-xl sm:text-2xl tracking-[0.3em] font-light text-white uppercase">
            AURELIAN
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block font-sans text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 bg-[#C5A059]/10 px-3 py-1 rounded-full">
              <Shield size={10} className="inline mr-1 -mt-0.5" /> Admin
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-[#888] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
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
    <div className="flex h-full bg-[var(--color-bg)] overflow-hidden flex-col md:flex-row">

      {/* Mobile Top Header */}
      <header className="md:hidden shrink-0 h-16 border-b border-[#ffffff15] px-6 flex items-center justify-between z-50 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0">
        <Link to="/" className="text-lg tracking-[0.3em] font-light text-white uppercase">
          AURELIAN
        </Link>
        {session?.user && (
          <button onClick={handleLogout} className="text-[#888] hover:text-[#C5A059] transition-colors p-2">
            <LogOut size={18} />
          </button>
        )}
      </header>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex shrink-0 w-64 flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] z-20"
      >
        <div className="h-24 flex items-center px-8 border-b border-[#1a1a1a] shrink-0">
          <Link to="/" className="text-2xl tracking-[0.35em] font-brand font-semibold text-[#E5C378] uppercase">
            AURELIAN
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
          {session?.user ? (
            <>
              <Link
                to="/booking"
                className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${
                  location.pathname === '/booking'
                    ? 'border-l-4 border-[#E5C378] bg-[#E5C378]/10 text-[#E5C378] font-medium'
                    : 'text-[#777] hover:text-white hover:bg-[#ffffff06] border-l-4 border-transparent'
                }`}
              >
                <CalendarDays size={18} className={location.pathname === '/booking' ? 'text-[#E5C378]' : 'text-[#777]'} />
                <span className="font-sans text-[11px] uppercase tracking-[0.2em]">Book</span>
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${
                  location.pathname === '/dashboard'
                    ? 'border-l-4 border-[#E5C378] bg-[#E5C378]/10 text-[#E5C378] font-medium'
                    : 'text-[#777] hover:text-white hover:bg-[#ffffff06] border-l-4 border-transparent'
                }`}
              >
                <LayoutDashboard size={18} className={location.pathname === '/dashboard' ? 'text-[#E5C378]' : 'text-[#777]'} />
                <span className="font-sans text-[11px] uppercase tracking-[0.2em]">Dashboard</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${
                  location.pathname === '/settings'
                    ? 'border-l-4 border-[#E5C378] bg-[#E5C378]/10 text-[#E5C378] font-medium'
                    : 'text-[#777] hover:text-white hover:bg-[#ffffff06] border-l-4 border-transparent'
                }`}
              >
                <Settings size={18} className={location.pathname === '/settings' ? 'text-[#E5C378]' : 'text-[#777]'} />
                <span className="font-sans text-[11px] uppercase tracking-[0.2em]">Settings</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-[#777] hover:text-white hover:bg-[#ffffff06] border-l-4 border-transparent transition-colors">
              <LogIn size={18} />
              <span className="font-sans text-[11px] uppercase tracking-[0.2em]">Sign In</span>
            </Link>
          )}
        </nav>
        {session?.user && (
          <div className="p-6 border-t border-[#1a1a1a] shrink-0 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl border border-[#E5C378] p-1 bg-[#111] shadow-[0_0_20px_rgba(229,195,120,0.25)] flex items-center justify-center overflow-hidden mb-2.5">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name} className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-[#181818] flex items-center justify-center">
                    <User size={26} className="text-[#E5C378]" />
                  </div>
                )}
              </div>
              <div className="text-sm font-light text-white tracking-wide truncate max-w-[190px]">
                {session.user.name || 'Vishal Patil'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg text-[#777] hover:text-white hover:border-[#E5C378] border border-[#262626] bg-[#0e0e0e] font-sans text-[10px] uppercase tracking-[0.25em] transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 md:pb-0">
        <div className="w-full px-4 sm:px-8 md:px-12 py-6 sm:py-10 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, filter: 'blur(4px)', y: 15 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', y: -15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 border-t border-[#ffffff15] bg-[#0a0a0a]/80 backdrop-blur-xl z-50 flex items-center justify-around px-2 pb-2">
        {session?.user ? (
          <>
            <Link
              to="/booking"
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${location.pathname === '/booking' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
                }`}
            >
              <CalendarDays size={20} />
              <span className="font-sans text-[9px] uppercase tracking-widest">Book</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${location.pathname === '/dashboard' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
                }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-sans text-[9px] uppercase tracking-widest">Dashboard</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${location.pathname === '/settings' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
                }`}
            >
              <Settings size={20} />
              <span className="font-sans text-[9px] uppercase tracking-widest">Settings</span>
            </Link>
          </>
        ) : (
          <Link to="/login" className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-[#555] hover:text-[#888]">
            <LogIn size={20} />
            <span className="font-sans text-[9px] uppercase tracking-widest">Sign In</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

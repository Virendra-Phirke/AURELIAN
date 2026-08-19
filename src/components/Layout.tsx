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
        className="hidden md:flex shrink-0 w-64 flex-col border-r border-[#ffffff15] bg-[#0a0a0a] z-20"
      >
        <div className="h-20 flex items-center px-8 border-b border-[var(--color-border)] shrink-0">
          <Link to="/" className="text-xl tracking-[0.3em] font-light text-white uppercase">
            AURELIAN
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
          {session?.user ? (
            <>
              <Link 
                to="/booking" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/booking' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30' 
                    : 'text-[#888] hover:text-white hover:bg-[#ffffff08] border border-transparent'
                }`}
              >
                <CalendarDays size={18} />
                <span className="font-sans text-[11px] uppercase tracking-widest">Book</span>
              </Link>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/dashboard' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30' 
                    : 'text-[#888] hover:text-white hover:bg-[#ffffff08] border border-transparent'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="font-sans text-[11px] uppercase tracking-widest">Dashboard</span>
              </Link>
              <Link 
                to="/settings" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === '/settings' 
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30' 
                    : 'text-[#888] hover:text-white hover:bg-[#ffffff08] border border-transparent'
                }`}
              >
                <Settings size={18} />
                <span className="font-sans text-[11px] uppercase tracking-widest">Settings</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#888] hover:text-white hover:bg-[#ffffff08] border border-transparent transition-colors">
              <LogIn size={18} />
              <span className="font-sans text-[11px] uppercase tracking-widest">Sign In</span>
            </Link>
          )}
        </nav>
        {session?.user && (
          <div className="p-6 border-t border-[#ffffff15] shrink-0 space-y-4">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name} className="w-10 h-10 rounded-full border border-[#ffffff15] object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#111] border border-[#ffffff15] flex items-center justify-center">
                  <User size={16} className="text-[#888]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-light text-white truncate">{session.user.name}</div>
                <div className="text-[9px] font-sans text-[#555] uppercase tracking-wider truncate">{session.user.email}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[#888] bg-[#111] hover:text-red-400 hover:bg-red-500/10 border border-[#ffffff15] hover:border-red-500/30 transition-all"
            >
              <LogOut size={16} />
              <span className="font-sans text-[10px] uppercase tracking-widest">Logout</span>
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
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                location.pathname === '/booking' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <CalendarDays size={20} />
              <span className="font-sans text-[9px] uppercase tracking-widest">Book</span>
            </Link>
            <Link 
              to="/dashboard" 
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                location.pathname === '/dashboard' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-sans text-[9px] uppercase tracking-widest">Dashboard</span>
            </Link>
            <Link 
              to="/settings" 
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                location.pathname === '/settings' ? 'text-[#C5A059]' : 'text-[#555] hover:text-[#888]'
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

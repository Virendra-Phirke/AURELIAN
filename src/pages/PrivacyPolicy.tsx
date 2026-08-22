import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Clock, FileText, Lock, Eye, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../components/magicui/theme-toggle';
import { useTheme } from '../lib/theme';
import { useLandingData } from '../lib/useLandingData';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { shop } = useLandingData();

  const brandName = shop?.shopName || 'AURELIAN';
  const email = shop?.email || 'concierge@aureliansalon.com';

  const sections = [
    {
      icon: ShieldCheck,
      title: '1. Atelier Privacy Charter',
      content:
        'At Aurelian, privacy is the cornerstone of bespoke luxury. We respect the confidentiality of our discerning patrons. This Privacy Policy outlines how your personal, contact, and appointment information is gathered, safeguarded, and utilized when engaging with our platform and physical atelier.',
    },
    {
      icon: Eye,
      title: '2. Information We Collect',
      items: [
        'Client Identity: Name, contact phone number, and verified email address.',
        'Session & Scheduling Records: Appointment time slots, requested master stylists, and service history.',
        'Aesthetic Profile: Private consultation notes, hair/skin typology, and bespoke service preferences.',
        'System & Security Tokens: Secure session authentication cookies, device credentials, and theme preference.',
      ],
    },
    {
      icon: Lock,
      title: '3. Purpose & Data Processing',
      content:
        'Your records exist solely to orchestrate seamless concierge scheduling, deliver personalized aesthetic rituals, and maintain strict member accountability. We never sell, lease, or monetize your information to third-party data brokers or advertising syndicates.',
    },
    {
      icon: FileText,
      title: '4. Security & Cryptographic Protection',
      content:
        'All client transactions and records are safeguarded using enterprise-grade AES-256 encryption at rest and TLS 1.3 in transit. Access to client profiles is strictly partitioned to certified atelier personnel on a need-to-know basis.',
    },
    {
      icon: CheckCircle2,
      title: '5. Member Rights & Sovereignty',
      items: [
        'Right to Access: Request a comprehensive export of your booking and consultation archives.',
        'Right to Rectification: Correct or update any personal or scheduling details at any time.',
        'Right to Erasure: Request permanent deletion ("Right to be Forgotten") of your account and records.',
        'Consent Withdrawal: Opt out of non-essential announcements and scheduling notifications.',
      ],
    },
    {
      icon: Bell,
      title: '6. Cookies & Local Cache',
      content:
        'We utilize minimal, privacy-first local storage and session cookies essential for maintaining your authenticated session state and preserving your light/dark aesthetic visual preference.',
    },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-body-text)',
      }}
    >
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300"
        style={{
          background: isDark ? 'rgba(6,6,6,0.92)' : 'rgba(248,246,240,0.92)',
          borderColor: isDark ? 'rgba(229,195,120,0.12)' : 'rgba(196,151,42,0.2)',
          boxShadow: isDark
            ? '0 10px 30px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(190,175,145,0.15)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer"
              style={{
                borderColor: isDark ? 'rgba(229,195,120,0.25)' : 'rgba(196,151,42,0.3)',
                color: 'var(--color-primary)',
                background: isDark ? 'rgba(229,195,120,0.05)' : 'rgba(255,255,255,0.7)',
                boxShadow: isDark ? 'none' : '2px 2px 6px rgba(190,175,145,0.15), -2px -2px 6px rgba(255,255,255,0.9)',
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <Link
              to="/"
              className="text-lg sm:text-xl font-brand tracking-[0.35em] font-semibold uppercase"
              style={{ color: 'var(--color-primary)' }}
            >
              ⚜ {brandName}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/booking"
              className="hidden sm:inline-flex font-sans text-xs uppercase tracking-widest font-bold px-5 py-2 rounded-full transition-all duration-200 shadow-md cursor-pointer"
              style={{
                color: isDark ? '#060606' : '#ffffff',
                background: isDark
                  ? 'linear-gradient(135deg, #e5c378 0%, #c4972a 100%)'
                  : 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
              }}
            >
              Reserve
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 sm:px-10 py-12 sm:py-16 space-y-12">
        {/* Title & Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-[0.25em] font-semibold"
            style={{
              background: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(184,134,11,0.12)',
              color: 'var(--color-primary)',
              border: isDark ? '1px solid rgba(229,195,120,0.2)' : '1px solid rgba(196,151,42,0.3)',
            }}
          >
            <ShieldCheck size={13} /> Legal &amp; Compliance Protocol
          </div>

          <h1
            className="font-brand text-4xl sm:text-5xl lg:text-6xl"
            style={{ color: 'var(--color-primary-text)' }}
          >
            Privacy{' '}
            <span className="text-gold-gradient">
              Policy
            </span>
          </h1>

          <p className="font-sans text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            Transparent data governance crafted with the same uncompromised standards as our grooming rituals.
          </p>
        </motion.div>

        {/* Requirements Status Alert Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 sm:p-7 rounded-3xl border transition-all duration-300"
          style={{
            borderColor: isDark ? 'rgba(229,195,120,0.3)' : 'rgba(184,134,11,0.35)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(229,195,120,0.08) 0%, rgba(20,16,10,0.85) 100%)'
              : 'linear-gradient(135deg, #fffdf8 0%, #fbf6ec 100%)',
            boxShadow: isDark
              ? '0 12px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)'
              : '8px 8px 24px rgba(190, 175, 145, 0.22), -8px -8px 24px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-bold"
              style={{
                background: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(184,134,11,0.15)',
                color: 'var(--color-primary)',
                border: isDark ? '1px solid rgba(229,195,120,0.3)' : '1px solid rgba(196,151,42,0.3)',
              }}
            >
              <AlertCircle size={24} />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-brand text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                  Privacy Policy Requirements
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest font-bold px-3 py-1 rounded-full"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(184,134,11,0.18)',
                    color: 'var(--color-primary)',
                    border: isDark ? '1px solid rgba(229,195,120,0.4)' : '1px solid rgba(196,151,42,0.4)',
                  }}
                >
                  <Clock size={11} /> Under Review
                </span>
              </div>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-body-text)' }}>
                <strong>The privacy policy requirements are currently under review</strong> by our legal and data governance team to ensure full adherence with international consumer privacy standards (GDPR, CCPA) and bespoke luxury confidentiality protocols. All client records remain fully encrypted and protected under our strict interim charter.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, content, items }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + idx * 0.05 }}
              className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300"
              style={{
                borderColor: isDark ? 'rgba(229,195,120,0.15)' : 'rgba(196,151,42,0.2)',
                background: isDark
                  ? 'linear-gradient(160deg, rgba(229,195,120,0.04) 0%, rgba(14,12,8,0.85) 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                boxShadow: isDark
                  ? '10px 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06)'
                  : '6px 6px 20px rgba(190, 175, 145, 0.18), -6px -6px 20px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(184,134,11,0.12)',
                    color: 'var(--color-primary)',
                    border: isDark ? '1px solid rgba(229,195,120,0.2)' : '1px solid rgba(196,151,42,0.25)',
                  }}
                >
                  <Icon size={18} />
                </div>
                <h3 className="font-brand text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                  {title}
                </h3>
              </div>

              {content && (
                <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                  {content}
                </p>
              )}

              {items && (
                <ul className="space-y-2.5 mt-3">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm font-sans" style={{ color: 'var(--color-secondary-text)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-primary)' }} />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>

        {/* Concierge & Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="p-8 rounded-3xl border text-center space-y-4"
          style={{
            borderColor: isDark ? 'rgba(229,195,120,0.25)' : 'rgba(196,151,42,0.3)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(229,195,120,0.08) 0%, rgba(18,14,10,0.9) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f3efe6 100%)',
            boxShadow: isDark
              ? '0 12px 35px rgba(0,0,0,0.6)'
              : '8px 8px 24px rgba(190, 175, 145, 0.2), -8px -8px 24px rgba(255, 255, 255, 0.95)',
          }}
        >
          <h3 className="font-brand text-2xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
            Privacy Concierge &amp; Inquiries
          </h3>
          <p className="font-sans text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            For privacy inquiries, data export requests, or inquiries regarding the policy review process, reach out directly to our Data Protection Officer.
          </p>
          <div className="pt-2">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-bold px-7 py-3 rounded-full transition-all duration-300 shadow-md cursor-pointer hover:scale-105"
              style={{
                color: isDark ? '#060606' : '#ffffff',
                background: isDark
                  ? 'linear-gradient(135deg, #e5c378 0%, #c4972a 100%)'
                  : 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                boxShadow: isDark
                  ? '0 4px 16px rgba(229,195,120,0.3)'
                  : '4px 4px 14px rgba(184,134,11,0.35), -2px -2px 8px rgba(255,255,255,0.9)',
              }}
            >
              Contact Privacy Concierge ({email})
            </a>
          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer
        className="border-t py-6 px-6 sm:px-10 text-center font-sans text-xs"
        style={{
          borderColor: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.18)',
          color: 'var(--color-muted-text)',
        }}
      >
        © {new Date().getFullYear()} {brandName}. All rights reserved. · Privacy Governance
      </footer>
    </div>
  );
}

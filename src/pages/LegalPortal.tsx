import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  FileText,
  Clock,
  ArrowLeft,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Scale,
  CreditCard,
  UserCheck,
  Sparkles,
  HelpCircle,
  Download,
  Search,
} from 'lucide-react';
import { ThemeToggle } from '../components/magicui/theme-toggle';
import { useTheme } from '../lib/theme';
import { useLandingData } from '../lib/useLandingData';

type LegalTab = 'privacy' | 'terms' | 'cancellation';

export default function LegalPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { shop } = useLandingData();

  // Determine initial tab from URL path
  const getInitialTab = (): LegalTab => {
    const path = location.pathname.toLowerCase();
    if (path.includes('term')) return 'terms';
    if (path.includes('cancel')) return 'cancellation';
    return 'privacy';
  };

  const [activeTab, setActiveTab] = useState<LegalTab>(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const brandName = shop?.shopName || 'AURELIAN';
  const email = shop?.email || 'concierge@aureliansalon.com';
  const phone = shop?.phone || '+1 (555) 234-5678';
  const address = shop?.address || '123 Luxury Ave, Beverly Hills, CA';
  const openingTime = shop?.openingTime || '09:00';
  const closingTime = shop?.closingTime || '18:00';
  const currency = shop?.currencySymbol || '$';

  const lastUpdated = 'August 22, 2026';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-body-text)',
      }}
    >
      {/* Top Sticky Header */}
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
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
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
            <button
              onClick={handlePrint}
              className="hidden md:inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer"
              style={{
                borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)',
                color: 'var(--color-secondary-text)',
              }}
              title="Print Document"
            >
              <Download size={13} /> Print / Save
            </button>
            <ThemeToggle />
            <Link
              to="/booking"
              className="hidden sm:inline-flex font-sans text-xs uppercase tracking-widest font-bold px-5 py-2 rounded-full transition-all duration-200 shadow-md cursor-pointer hover:scale-105"
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-10 py-10 sm:py-16 space-y-10">
        {/* Header Title & Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-[0.25em] font-semibold"
            style={{
              background: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(184,134,11,0.12)',
              color: 'var(--color-primary)',
              border: isDark ? '1px solid rgba(229,195,120,0.2)' : '1px solid rgba(196,151,42,0.3)',
            }}
          >
            <Scale size={13} /> Legal, Governance &amp; Compliance Center
          </div>

          <h1 className="font-brand text-4xl sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-primary-text)' }}>
            Atelier{' '}
            <span className="text-gold-gradient">
              Governance &amp; Terms
            </span>
          </h1>

          <p className="font-sans text-xs sm:text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            Transparent policies engineered with the uncompromising precision of our private grooming sanctuary. Last revised: <strong>{lastUpdated}</strong>.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4" style={{ borderColor: isDark ? 'rgba(229,195,120,0.15)' : 'rgba(196,151,42,0.2)' }}>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {[
              { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
              { id: 'terms', label: 'Terms & Conditions', icon: FileText },
              { id: 'cancellation', label: 'Booking & Cancellation', icon: Clock },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as LegalTab)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    color: active ? (isDark ? '#060606' : '#ffffff') : 'var(--color-secondary-text)',
                    background: active
                      ? (isDark ? 'linear-gradient(135deg, #e5c378 0%, #c4972a 100%)' : 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)')
                      : (isDark ? 'rgba(229,195,120,0.06)' : 'rgba(255,255,255,0.7)'),
                    border: active ? 'none' : (isDark ? '1px solid rgba(229,195,120,0.18)' : '1px solid rgba(196,151,42,0.22)'),
                    boxShadow: active
                      ? (isDark ? '0 4px 16px rgba(229,195,120,0.3)' : '4px 4px 12px rgba(184,134,11,0.3), -2px -2px 8px rgba(255,255,255,0.9)')
                      : (isDark ? 'none' : '2px 2px 6px rgba(190,175,145,0.15), -2px -2px 6px rgba(255,255,255,0.9)'),
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-text)' }} />
            <input
              type="text"
              placeholder="Search legal articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border outline-none font-sans transition-all"
              style={{
                borderColor: isDark ? 'rgba(229,195,120,0.2)' : 'rgba(196,151,42,0.25)',
                background: isDark ? 'rgba(15,15,15,0.6)' : 'rgba(255,255,255,0.8)',
                color: 'var(--color-primary-text)',
              }}
            />
          </div>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Notice Banner */}
              <div
                className="p-6 rounded-3xl border transition-all duration-300"
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
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold"
                    style={{
                      background: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(184,134,11,0.15)',
                      color: 'var(--color-primary)',
                      border: isDark ? '1px solid rgba(229,195,120,0.3)' : '1px solid rgba(196,151,42,0.3)',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-brand text-base font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                      Global Data Protection Charter (GDPR &amp; CCPA Compliant)
                    </h2>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                      {brandName} is committed to the absolute sanctuary of client data. We operate a zero-monetization architecture — your profile, consultation logs, and styling preferences are never shared with advertising networks or third-party brokers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Articles */}
              <div className="space-y-6">
                {[
                  {
                    num: '1.0',
                    title: 'Data Controller & Atelier Scope',
                    icon: UserCheck,
                    content: `This Privacy Policy applies to all digital interactions on the ${brandName} web portal and our physical flagship ateliers located at ${address}. ${brandName} operates as the Data Controller under applicable data protection laws. For all data requests, our Data Protection Officer is reachable directly at ${email}.`,
                  },
                  {
                    num: '2.0',
                    title: 'Categories of Information Collected',
                    icon: Eye,
                    content: `We collect strictly the minimum data required to deliver world-class aesthetic services:`,
                    bullets: [
                      'Identity & Contact Credentials: Full name, verified mobile phone number, and email address for session confirmations and security tokens.',
                      'Scheduling & Transaction Archives: Selected master stylists, appointment timestamps, booking reference codes, service tier selections, and payment receipts.',
                      'Bespoke Morphological & Consultation Notes: Stylist consultation notes, scalp/skin sensitivities, and custom formulation logs necessary for personalized care.',
                      'Technical & Authentication Telemetry: Secure session identifiers, encrypted authentication tokens, IP timestamps, and aesthetic theme preferences.',
                    ],
                  },
                  {
                    num: '3.0',
                    title: 'Legal Basis & Processing Objectives',
                    icon: Scale,
                    content: `Your data is processed under the following lawful bases:`,
                    bullets: [
                      'Contractual Performance: Processing appointments, sending transactional schedule notifications, and managing VIP reservations.',
                      'Legitimate Atelier Interests: Protecting the physical and digital security of our private suites and preventing fraudulent bookings.',
                      'Explicit Consent: Transmitting exclusive member invitations and seasonal collection previews, which you may revoke at any time.',
                      'Statutory Compliance: Fulfilling statutory accounting, tax, and licensing retention obligations.',
                    ],
                  },
                  {
                    num: '4.0',
                    title: 'Zero-Monetization & Sub-Processor Protocol',
                    icon: Lock,
                    content: `We enforce a strict Zero-Monetization guarantee. We do not sell, rent, or trade client personal records under any circumstance. We engage solely essential infrastructure sub-processors bound by stringent confidentiality agreements (including secure cloud database hosting with Neon/PostgreSQL, transactional email relays via Resend, and SSL/TLS edge delivery).`,
                  },
                  {
                    num: '5.0',
                    title: 'Cryptographic Security & Data Retention',
                    icon: ShieldCheck,
                    content: `All client records are encrypted using AES-256 at rest and TLS 1.3 in transit. Profile records remain active during your membership. Inactive client profiles with zero appointment history over 24 consecutive months are scheduled for automated cryptographic redaction and permanent purge.`,
                  },
                  {
                    num: '6.0',
                    title: 'Your Statutory Member Rights',
                    icon: CheckCircle2,
                    content: `Under GDPR, CCPA, and global privacy mandates, you maintain sovereign authority over your records:`,
                    bullets: [
                      'Right of Access & Portability: Request an export of your full profile and styling archive in machine-readable JSON format.',
                      'Right to Rectification: Instantly modify incorrect contact or scheduling details via the Client Portal.',
                      'Right to Erasure (Right to Be Forgotten): Request complete deletion of your account and historical consultation notes.',
                      'Right to Restrict & Object: Restrict processing of specific records or opt out of non-transactional communications.',
                    ],
                  },
                  {
                    num: '7.0',
                    title: 'Cookies & Visual Preference Cache',
                    icon: Sparkles,
                    content: `We do not deploy cross-site tracking cookies. We utilize strictly necessary session cookies for user authentication and local storage keys (such as 'aurelian-ui-theme') to preserve your preferred Light/Dark visual appearance across visits.`,
                  },
                ]
                  .filter(
                    item =>
                      !searchQuery ||
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(({ num, title, icon: Icon, content, bullets }) => (
                    <div
                      key={title}
                      className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300 space-y-3"
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
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg" style={{ background: isDark ? 'rgba(229,195,120,0.15)' : 'rgba(184,134,11,0.15)', color: 'var(--color-primary)' }}>
                          {num}
                        </span>
                        <h3 className="font-brand text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                          {title}
                        </h3>
                      </div>
                      <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                        {content}
                      </p>
                      {bullets && (
                        <ul className="space-y-2 pt-2">
                          {bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans" style={{ color: 'var(--color-secondary-text)' }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-primary)' }} />
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div
              key="terms-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Notice Banner */}
              <div
                className="p-6 rounded-3xl border transition-all duration-300"
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
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold"
                    style={{
                      background: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(184,134,11,0.15)',
                      color: 'var(--color-primary)',
                      border: isDark ? '1px solid rgba(229,195,120,0.3)' : '1px solid rgba(196,151,42,0.3)',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-brand text-base font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                      Terms of Service &amp; Atelier Engagement
                    </h2>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                      By accessing the {brandName} portal or booking an appointment, you agree to comply with our code of conduct, reservation guidelines, and service agreements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Articles */}
              <div className="space-y-6">
                {[
                  {
                    num: '1.0',
                    title: 'Binding Agreement & Eligibility',
                    content: `By accessing or using the ${brandName} booking platform or visiting our ateliers, you represent that you are at least 18 years of age (or accompanied by a legal guardian) and possess the legal capacity to enter into binding agreements.`,
                  },
                  {
                    num: '2.0',
                    title: 'Private Suite Exclusivity & Decorum',
                    content: `To preserve the tranquility and discretion of our sanctuary, all guests are requested to maintain reasonable mobile device silence and arrive promptly. ${brandName} reserves the right to refuse service or terminate sessions for abusive behavior, intoxication, or violation of atelier decorum.`,
                  },
                  {
                    num: '3.0',
                    title: 'Reservation, Slot Locks & Confirmations',
                    content: `Appointments booked online are secured in real-time. Operating hours are ${openingTime} to ${closingTime}. Appointments must be booked with sufficient advance notice as defined by the atelier console.`,
                    bullets: [
                      'Auto-Confirmation: Upon reserving, an automated booking confirmation code is issued immediately.',
                      'Arrival Window: We recommend arriving 10 minutes prior to your scheduled consultation to enjoy our sensory welcome ritual.',
                      'Late Arrivals: Arrivals exceeding 15 minutes past the scheduled start time may require abbreviated treatments to respect subsequent patrons.',
                    ],
                  },
                  {
                    num: '4.0',
                    title: 'Pricing, Currency & Payment Terms',
                    content: `All service rates are quoted transparently in ${currency}. Prices reflect the bespoke artisanal craftsmanship, proprietary botanical treatments, and master stylist allocations. Prices are subject to revision with reasonable advance notice on the official menu.`,
                  },
                  {
                    num: '5.0',
                    title: 'Health, Allergy & Chemical Disclosures',
                    content: `Clients are required to disclose any dermatological conditions, open lesions, allergies, or previous adverse reactions to cosmetic treatments prior to service commencement. Patch tests may be mandated by master stylists prior to specialty chemical treatments.`,
                  },
                  {
                    num: '6.0',
                    title: 'Limitation of Liability',
                    content: `${brandName} takes utmost care in delivering surgical-grade styling and treatments. To the fullest extent permitted by applicable law, ${brandName} shall not be liable for indirect, incidental, or consequential damages arising from unannounced health conditions or loss of personal effects on premises. Secure lockers are provided in all VIP suites.`,
                  },
                  {
                    num: '7.0',
                    title: 'Intellectual Property & Brand Heritage',
                    content: `All visual assets, 3D interactive models, bespoke brand marks, photography, and ritual formulations are the exclusive intellectual property of ${brandName}. Unauthorized reproduction is strictly prohibited.`,
                  },
                  {
                    num: '8.0',
                    title: 'Governing Law & Jurisdiction',
                    content: `These Terms and Conditions shall be governed by and construed in accordance with the laws governing the jurisdiction of our flagship location, without regard to conflict of law principles.`,
                  },
                ]
                  .filter(
                    item =>
                      !searchQuery ||
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(({ num, title, content, bullets }) => (
                    <div
                      key={title}
                      className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300 space-y-3"
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
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg" style={{ background: isDark ? 'rgba(229,195,120,0.15)' : 'rgba(184,134,11,0.15)', color: 'var(--color-primary)' }}>
                          {num}
                        </span>
                        <h3 className="font-brand text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                          {title}
                        </h3>
                      </div>
                      <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                        {content}
                      </p>
                      {bullets && (
                        <ul className="space-y-2 pt-2">
                          {bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans" style={{ color: 'var(--color-secondary-text)' }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-primary)' }} />
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'cancellation' && (
            <motion.div
              key="cancellation-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Notice Banner */}
              <div
                className="p-6 rounded-3xl border transition-all duration-300"
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
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold"
                    style={{
                      background: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(184,134,11,0.15)',
                      color: 'var(--color-primary)',
                      border: isDark ? '1px solid rgba(229,195,120,0.3)' : '1px solid rgba(196,151,42,0.3)',
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-brand text-base font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                      Cancellation, Rescheduling &amp; No-Show Policy
                    </h2>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                      Our Grand Masters allocate dedicated private suites and tailored preparation for every scheduled session. We kindly ask that adjustments be made with reasonable notice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancellation Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Graceful Rescheduling',
                    time: 'Up to 4 Hours Prior',
                    desc: 'You may modify or reschedule your reservation through your Client Dashboard or by contacting the Concierge desk with no penalty.',
                    icon: CheckCircle2,
                  },
                  {
                    title: 'Cancellation Window',
                    time: 'Self-Service Enabled',
                    desc: 'Cancellations executed prior to the cutoff window release your private suite instantly to our waitlist members.',
                    icon: Clock,
                  },
                  {
                    title: 'Late Notice Adjustments',
                    time: 'Within Cutoff Window',
                    desc: 'Cancellations made within the immediate cutoff window may be subject to a nominal reservation holding fee.',
                    icon: AlertTriangle,
                  },
                  {
                    title: 'No-Show Resolution',
                    time: 'Unnotified Absence',
                    desc: 'Unannounced missed appointments prevent other patrons from booking. Repeated no-shows may require prepaid booking authorization.',
                    icon: Scale,
                  },
                ].map(({ title, time, desc, icon: Icon }) => (
                  <div
                    key={title}
                    className="p-6 rounded-3xl border backdrop-blur-xl space-y-3 transition-all duration-300"
                    style={{
                      borderColor: isDark ? 'rgba(229,195,120,0.18)' : 'rgba(196,151,42,0.22)',
                      background: isDark
                        ? 'linear-gradient(160deg, rgba(229,195,120,0.04) 0%, rgba(16,14,10,0.85) 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f7f4ec 100%)',
                      boxShadow: isDark
                        ? '10px 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06)'
                        : '6px 6px 20px rgba(190, 175, 145, 0.18), -6px -6px 20px rgba(255, 255, 255, 0.95), inset 0 1px 1px rgba(255, 255, 255, 1)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isDark ? 'rgba(229,195,120,0.15)' : 'rgba(184,134,11,0.15)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-sans text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full" style={{ background: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(184,134,11,0.1)', color: 'var(--color-primary)' }}>
                        {time}
                      </span>
                    </div>
                    <h3 className="font-brand text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>
                      {title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concierge Support Footer Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
            Need Legal Clarification or Concierge Assistance?
          </h3>
          <p className="font-sans text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--color-secondary-text)' }}>
            Our compliance desk is available Monday through Saturday to answer questions regarding data governance, membership agreements, or custom VIP arrangements.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-full transition-all duration-300 shadow-md cursor-pointer hover:scale-105"
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
              Email Concierge ({email})
            </a>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-semibold px-6 py-3 rounded-full border transition-all duration-300 cursor-pointer"
              style={{
                borderColor: isDark ? 'rgba(229,195,120,0.3)' : 'rgba(196,151,42,0.35)',
                color: 'var(--color-primary)',
                background: isDark ? 'rgba(229,195,120,0.06)' : 'rgba(255,255,255,0.8)',
              }}
            >
              Call {phone}
            </a>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 px-6 sm:px-10 text-center font-sans text-xs"
        style={{
          borderColor: isDark ? 'rgba(229,195,120,0.1)' : 'rgba(196,151,42,0.18)',
          color: 'var(--color-muted-text)',
        }}
      >
        © {new Date().getFullYear()} {brandName}. All rights reserved. · Haute Coiffure &amp; Grooming Sanctuary Governance
      </footer>
    </div>
  );
}

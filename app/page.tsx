/**
 * Persona Home - Production Entry Point
 * /psra.sevensa.nl
 *
 * Principal Engineer redesign x100
 * - Semantic tokens, AA accessibility
 * - Keyboard nav, focus management
 * - Telemetry integration
 * - Performance optimized
 */

'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, TrendingUp, Users, Package } from 'lucide-react'
import { useEffect } from 'react'

// Telemetry hook (to be implemented)
const useTelemetry = () => {
  const track = (event: string, data?: Record<string, any>) => {
    // Integration point for analytics (Google Analytics, Segment, etc.)
    if (typeof window !== 'undefined') {
      // @ts-ignore - gtag will be loaded by analytics script
      if (window.gtag) window.gtag('event', event, data)
    }
    console.log('[Telemetry]', event, data)
  }
  return { track }
}

export default function PersonaHomePage() {
  const router = useRouter()
  const { track } = useTelemetry()

  useEffect(() => {
    track('persona_home_mount')
  }, [])

  const personas = [
    {
      id: 'compliance',
      title: 'Compliance Manager',
      subtitle: 'Suus - Trade Compliance Expert',
      description: 'Start Origin Checks, generate LTSD certificates, request missing Certificates of Origin, and maintain complete audit trails.',
      icon: CheckCircle2,
      iconBg: 'bg-sevensa-teal/10',
      iconColor: 'text-sevensa-teal',
      path: '/dashboard',
      stats: [
        { label: 'Recent assessments', value: '24' },
        { label: 'Pending CoO requests', value: '3' },
        { label: 'LTSD certificates', value: '12' },
      ],
      features: [
        'One-click Origin Check validation',
        'LTSD certificate generation',
        'Automated CoO request workflow',
        'Complete audit pack exports',
      ],
      cta: 'Access Compliance Dashboard',
      gradient: 'from-sevensa-teal/5 via-sevensa-teal/10 to-transparent',
    },
    {
      id: 'cfo',
      title: 'CFO / Manager',
      subtitle: 'Financial & Risk Overview',
      description: 'Track cost savings, monitor at-risk products, approve pending decisions, and visualize compliance ROI with real-time insights.',
      icon: TrendingUp,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      path: '/cfo',
      stats: [
        { label: 'Savings MTD', value: '€24.5K' },
        { label: 'At-risk products', value: '2' },
        { label: 'Open approvals', value: '5' },
      ],
      features: [
        'Real-time savings metrics',
        'Risk product monitoring',
        'Approval workflow dashboard',
        'Pass/Fail trend analysis',
      ],
      cta: 'View Financial Dashboard',
      gradient: 'from-success/5 via-success/10 to-transparent',
    },
    {
      id: 'supplier',
      title: 'Supplier',
      subtitle: 'Certificate Management',
      description: 'Upload Certificates of Origin per BOM node, track submission status, complete supply chain closure, and enable LTSD finalization.',
      icon: Package,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      path: '/supplier',
      stats: [
        { label: 'Active chains', value: '8' },
        { label: 'Coverage', value: '87%' },
        { label: 'Pending uploads', value: '4' },
      ],
      features: [
        'Streamlined CoO upload wizard',
        'Real-time chain coverage tracking',
        'Automated validation checks',
        'Status notifications',
      ],
      cta: 'Open Supplier Portal',
      gradient: 'from-info/5 via-info/10 to-transparent',
    },
  ]

  const handlePersonaClick = (persona: typeof personas[0]) => {
    track('persona_card_click', {
      persona_id: persona.id,
      persona_title: persona.title,
      target_path: persona.path,
    })
    router.push(persona.path)
  }

  const handleKeyDown = (e: React.KeyboardEvent, persona: typeof personas[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePersonaClick(persona)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-surface to-bg-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sevensa-dark via-sevensa-dark/95 to-sevensa-dark/90">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sevensa-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-info/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sevensa-teal/20 border border-sevensa-teal/30 backdrop-blur-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sevensa-teal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sevensa-teal" />
              </span>
              <span className="text-sm font-medium text-white/90">
                AI-Powered Trade Compliance Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-sevensa-teal via-info to-sevensa-teal bg-clip-text text-transparent">
                PSRA-LTSD
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed">
              Preferential Rules of Origin Analysis
            </p>

            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
              Choose your role below to access tailored workflows, real-time insights,
              and AI-powered compliance tools designed for your specific needs.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { label: '78.5%', sublabel: 'Time Reduction' },
                { label: '< 2.5s', sublabel: 'Decision Time' },
                { label: '99.2%', sublabel: 'Accuracy' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-white/60">
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Persona Cards Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            Select Your Role
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Each persona provides a tailored experience with role-specific workflows,
            insights, and actions.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {personas.map((persona) => {
            const Icon = persona.icon
            return (
              <article
                key={persona.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border-subtle hover:border-sevensa-teal/50 focus-within:ring-4 focus-within:ring-sevensa-teal/20 cursor-pointer"
                onClick={() => handlePersonaClick(persona)}
                onKeyDown={(e) => handleKeyDown(e, persona)}
                tabIndex={0}
                role="button"
                aria-label={`Navigate to ${persona.title} dashboard`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${persona.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

                {/* Content */}
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${persona.iconBg} mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${persona.iconColor}`} />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-sevensa-teal transition-colors">
                    {persona.title}
                  </h3>
                  <p className="text-sm font-medium text-text-muted mb-4">
                    {persona.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {persona.description}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border-subtle">
                    {persona.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xl font-bold text-text-primary mb-1">
                          {stat.value}
                        </div>
                        <div className="text-xs text-text-muted">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {persona.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-sevensa-teal hover:bg-sevensa-teal-dark text-white font-semibold rounded-lg transition-all duration-200 group-hover:gap-3 focus:outline-none focus:ring-2 focus:ring-sevensa-teal focus:ring-offset-2"
                    aria-label={persona.cta}
                  >
                    {persona.cta}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Hover Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sevensa-teal via-info to-success transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </article>
            )
          })}
        </div>
      </section>

      {/* Quick Links / Footer Section */}
      <section className="bg-bg-muted border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Need Help?</h3>
              <a href="#" className="text-sevensa-teal hover:text-sevensa-teal-dark transition-colors">
                View Documentation →
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Quick Demo</h3>
              <a href="https://demo.sevensa.nl" className="text-sevensa-teal hover:text-sevensa-teal-dark transition-colors">
                Try Interactive Demo →
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-2">API Access</h3>
              <a href="#" className="text-sevensa-teal hover:text-sevensa-teal-dark transition-colors">
                View API Docs →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// CSS for grid pattern (add to globals.css)
const gridPatternStyles = `
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}
`

/**
 * Demo One-Page Site - Production
 * https://demo.sevensa.nl
 *
 * x100 Design Quality:
 * - Compact showcase of PSRA-LTSD platform
 * - 4 sections: Tour, Chain, XAI, Personas
 * - Smooth scroll navigation
 * - Sevensa brand identity
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Upload,
  Play,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Package,
  Users,
  FileText,
  GitBranch,
  Brain,
  Clock,
  Target,
  Eye
} from 'lucide-react'

export default function DemoPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('tour')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Update active section based on scroll position
      const sections = ['tour', 'chain', 'xai', 'personas']
      const current = sections.find(section => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 150 && rect.bottom >= 150
        }
        return false
      })
      if (current) setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sevensa-dark via-sevensa-dark/95 to-sevensa-dark/90">
      {/* Sticky Navigation */}
      <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-sevensa-dark/90 backdrop-blur-lg border-b border-white/10 shadow-xl' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sevensa-teal to-info rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">PSRA-LTSD</div>
                <div className="text-xs text-white/60">AI Trade Compliance</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { id: 'tour', label: 'Tour' },
                { id: 'chain', label: 'Chain' },
                { id: 'xai', label: 'XAI' },
                { id: 'personas', label: 'Personas' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-sevensa-teal'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <a
              href="https://psra.sevensa.nl"
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sevensa-teal to-info hover:opacity-90 text-white font-semibold rounded-lg transition-all"
            >
              Try Production
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sevensa-teal/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-info/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sevensa-teal/20 border border-sevensa-teal/30 backdrop-blur-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sevensa-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sevensa-teal" />
            </span>
            <span className="text-sm font-medium text-white/90">
              Live Interactive Demo
            </span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            AI-Powered Trade Compliance
            <br />
            <span className="bg-gradient-to-r from-sevensa-teal via-info to-sevensa-teal bg-clip-text text-transparent">
              in 60 Seconds
            </span>
          </h1>

          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
            Experience how PSRA-LTSD automates preferential origin checks, generates LTSD certificates,
            and provides explainable AI decisions for trade compliance.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('tour')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sevensa-teal to-info hover:opacity-90 text-white text-lg font-semibold rounded-lg transition-all shadow-xl"
            >
              <Play className="w-5 h-5" />
              Start Demo Tour
            </button>
            <a
              href="/features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-lg transition-all backdrop-blur-sm"
            >
              View Features
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            {[
              { label: '78.5% Time Saved', icon: Zap },
              { label: '< 2.5s Decisions', icon: Clock },
              { label: '99.2% Accuracy', icon: Target }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-8 h-8 text-sevensa-teal mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">{stat.label.split(' ')[0]}</div>
                <div className="text-sm text-white/60">{stat.label.split(' ').slice(1).join(' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Section */}
      <section id="tour" className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Quick Platform Tour
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Three powerful personas, one unified platform
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle2,
                title: 'Compliance Manager',
                subtitle: 'Origin Checks & LTSD',
                features: [
                  'Start new origin check in 1 click',
                  'Auto-generate LTSD certificates',
                  'Request missing CoO from suppliers',
                  'Export complete audit packs'
                ],
                color: 'sevensa-teal',
                link: 'https://psra.sevensa.nl/dashboard'
              },
              {
                icon: TrendingUp,
                title: 'CFO Dashboard',
                subtitle: 'Financial Insights',
                features: [
                  'Real-time savings metrics',
                  'At-risk product monitoring',
                  'Approval workflow management',
                  'Pass/Fail trend analysis'
                ],
                color: 'success',
                link: 'https://psra.sevensa.nl/cfo'
              },
              {
                icon: Package,
                title: 'Supplier Portal',
                subtitle: 'CoO Management',
                features: [
                  '4-step CoO upload wizard',
                  'Chain coverage tracking',
                  'Automated validation checks',
                  'Status notifications'
                ],
                color: 'info',
                link: 'https://psra.sevensa.nl/supplier'
              }
            ].map((persona, i) => {
              const Icon = persona.icon
              return (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-sevensa-teal/50 transition-all hover:shadow-2xl group"
                >
                  <div className={`inline-flex p-4 bg-${persona.color}/20 rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 text-${persona.color}`} />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{persona.title}</h3>
                  <p className="text-white/60 mb-6">{persona.subtitle}</p>

                  <ul className="space-y-3 mb-8">
                    {persona.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/80">
                        <CheckCircle2 className={`w-4 h-4 text-${persona.color} shrink-0 mt-0.5`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={persona.link}
                    className={`inline-flex items-center gap-2 px-6 py-3 bg-${persona.color} hover:opacity-90 text-white font-semibold rounded-lg transition-all w-full justify-center`}
                  >
                    Try Live Demo
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Chain Section */}
      <section id="chain" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/20 border border-info/30 mb-6">
                <GitBranch className="w-4 h-4 text-info" />
                <span className="text-sm font-medium text-white">Supply Chain Tracking</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Complete BOM Chain Visualization
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Track every node in your supply chain. Upload Certificates of Origin,
                monitor coverage percentage, and close supply chains with full transparency.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Real-time Coverage %', value: '87%', icon: Target },
                  { label: 'Missing CoO Nodes', value: '2', icon: Upload },
                  { label: 'Certificate Status', value: '7/7', icon: CheckCircle2 }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="p-2 bg-info/20 rounded-lg">
                      <stat.icon className="w-5 h-5 text-info" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/60">{stat.label}</div>
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                {/* BOM Tree Visualization */}
                <div className="space-y-4">
                  {/* Root Node */}
                  <div className="flex items-center gap-3 p-4 bg-sevensa-teal/20 rounded-lg border border-sevensa-teal/30">
                    <CheckCircle2 className="w-6 h-6 text-sevensa-teal" />
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">Electronic Module</div>
                      <div className="text-xs text-white/60">HS: 8537.10.99 • 100%</div>
                    </div>
                    <div className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded">
                      ✓ Certified
                    </div>
                  </div>

                  {/* Child Nodes */}
                  <div className="ml-8 space-y-2">
                    {[
                      { name: 'PCB Assembly', hs: '8534.00.00', value: '35%', certified: true },
                      { name: 'Connector Set', hs: '8536.69.00', value: '15%', certified: true },
                      { name: 'Capacitor Array', hs: '8532.24.00', value: '20%', certified: false }
                    ].map((node, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          node.certified
                            ? 'bg-white/5 border-white/10'
                            : 'bg-warning/10 border-warning/30'
                        }`}
                      >
                        {node.certified ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Upload className="w-5 h-5 text-warning" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{node.name}</div>
                          <div className="text-xs text-white/60">{node.hs} • {node.value}</div>
                        </div>
                        {!node.certified && (
                          <button className="px-3 py-1 bg-warning/20 hover:bg-warning/30 text-warning text-xs font-medium rounded transition-colors">
                            Upload CoO
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                    <span>Chain Coverage</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-sevensa-teal to-info rounded-full h-2" style={{ width: '87%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* XAI Section */}
      <section id="xai" className="py-20 px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sevensa-teal/20 border border-sevensa-teal/30 mb-6">
              <Brain className="w-4 h-4 text-sevensa-teal" />
              <span className="text-sm font-medium text-white">Explainable AI</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Full XAI Result Explainer
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Understand every AI decision with complete transparency and traceability
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Decision Summary */}
            <div className="bg-gradient-to-br from-success/20 via-success/10 to-transparent rounded-2xl p-8 border-2 border-success/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-success/20 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-success mb-1">GO</div>
                  <div className="text-sm text-white/70">Preferential Origin Qualified</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold text-white/60 mb-2">Decision Reason</div>
                <div className="text-white leading-relaxed">
                  Product qualifies under CTH rule with sufficient regional value content (52% &gt; 45% threshold)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'AI Confidence', value: '94%', icon: Brain },
                  { label: 'Processing', value: '1.8s', icon: Clock },
                  { label: 'Agreement', value: 'EU-VN', icon: FileText },
                  { label: 'Savings', value: '€3.4K', icon: TrendingUp }
                ].map((metric, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center gap-2 text-white/60 mb-1">
                      <metric.icon className="w-3 h-3" />
                      <div className="text-xs">{metric.label}</div>
                    </div>
                    <div className="text-lg font-bold text-white">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rule Path */}
            <div className="space-y-3">
              <div className="text-lg font-semibold text-white mb-4">Rule Path Evaluation</div>
              {[
                { rule: 'CTH', name: 'Change in Tariff Heading', passed: true, result: '8534 → 8537' },
                { rule: 'CTSH', name: 'Change in Subheading', passed: true, result: '8534.00 → 8537.10' },
                { rule: 'VA', name: 'Value Added', passed: true, result: '52% regional content' },
                { rule: 'WO', name: 'Wholly Obtained', passed: false, result: 'Not applicable' }
              ].map((checkpoint, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border transition-all ${
                    checkpoint.passed
                      ? 'bg-success/10 border-success/30'
                      : 'bg-white/5 border-white/10 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {checkpoint.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white/40" />
                      )}
                      <div>
                        <div className="font-semibold text-white text-sm">{checkpoint.name}</div>
                        <div className="text-xs text-white/60">{checkpoint.result}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      checkpoint.passed ? 'bg-success text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {checkpoint.rule}
                    </span>
                  </div>
                </div>
              ))}

              <a
                href="https://psra.sevensa.nl/assessment/assessment-001"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sevensa-teal hover:opacity-90 text-white font-semibold rounded-lg transition-all w-full justify-center mt-4"
              >
                <Eye className="w-4 h-4" />
                View Full XAI Explainer
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section id="personas" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Tailored experiences for compliance managers, executives, and suppliers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Compliance',
                desc: 'Daily operations',
                color: 'sevensa-teal',
                stats: ['24 assessments', '3 pending CoO', '12 LTSD certs']
              },
              {
                title: 'CFO',
                desc: 'Executive insights',
                color: 'success',
                stats: ['€24.5K savings', '2 at-risk', '5 approvals']
              },
              {
                title: 'Supplier',
                desc: 'Certificate upload',
                color: 'info',
                stats: ['8 active chains', '87% coverage', '4 pending']
              }
            ].map((persona, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-sevensa-teal/50 transition-all"
              >
                <div className="text-2xl font-bold text-white mb-2">{persona.title}</div>
                <div className="text-white/60 mb-6">{persona.desc}</div>
                <div className="space-y-2">
                  {persona.stats.map((stat, j) => (
                    <div key={j} className="text-sm text-white/80">
                      • {stat}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="https://psra.sevensa.nl"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sevensa-teal to-info hover:opacity-90 text-white text-lg font-semibold rounded-lg transition-all shadow-xl"
            >
              Try Full Production Platform
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-sevensa-teal to-info rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold text-white">PSRA-LTSD</div>
              </div>
              <p className="text-white/60 text-sm">
                AI-powered trade compliance platform by Sevensa
              </p>
            </div>

            <div>
              <div className="text-white font-semibold mb-4">Resources</div>
              <div className="space-y-2">
                <a href="/features" className="block text-white/60 hover:text-white transition-colors text-sm">
                  Features
                </a>
                <a href="/tech" className="block text-white/60 hover:text-white transition-colors text-sm">
                  Technology
                </a>
                <a href="https://psra.sevensa.nl" className="block text-white/60 hover:text-white transition-colors text-sm">
                  Production Platform
                </a>
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-4">Company</div>
              <div className="space-y-2">
                <div className="text-white/60 text-sm">© 2025 Sevensa</div>
                <div className="text-white/60 text-sm">AI-powered solutions for businesses</div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            Built with Next.js 14 • Deployed on Sevensa Infrastructure
          </div>
        </div>
      </footer>
    </div>
  )
}

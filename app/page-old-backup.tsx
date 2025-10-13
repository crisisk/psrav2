'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-white to-bg-surface dark:from-dark-bg-base dark:to-dark-bg-surface">
      {/* Navigation */}
      <nav className="border-b border-border dark:border-dark-border bg-white/80 dark:bg-dark-bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/sevensa_final_logo.png"
                alt="Sevensa"
                width={140}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="#features"
                className="text-sm font-medium text-text-secondary hover:text-sevensa-teal transition-colors"
              >
                Features
              </Link>
              <Link
                href="#personas"
                className="text-sm font-medium text-text-secondary hover:text-sevensa-teal transition-colors"
              >
                Personas
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-5 py-2.5 bg-sevensa-teal hover:bg-sevensa-teal-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Start Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-sevensa-teal/10 text-sevensa-teal rounded-full text-sm font-semibold mb-6">
              <span className="animate-pulse mr-2">●</span>
              AI-Powered Trade Compliance
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-6 leading-tight">
              Klaar voor de volgende stap?
            </h1>

            <p className="text-xl text-text-secondary dark:text-dark-text-secondary mb-8 leading-relaxed">
              Ontdek hoe onze ethische AI uw bedrijf laat groeien met <span className="text-sevensa-teal font-semibold">PSRA-LTSD</span>:
              Preferential Rules of Origin Analysis die binnen 90 dagen meetbare ROI levert.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">90-dagen ROI garantie</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Ethische AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">Deep Industry Customization</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-sevensa-teal hover:bg-sevensa-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#personas"
                className="inline-flex items-center px-8 py-4 bg-white dark:bg-dark-bg-surface border-2 border-sevensa-teal text-sevensa-teal hover:bg-sevensa-teal/5 font-bold rounded-xl transition-all duration-200"
              >
                Bekijk Personas
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-sevensa-teal-50 to-sevensa-teal-100 dark:from-sevensa-teal-900/20 dark:to-sevensa-teal-800/20 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white dark:bg-dark-bg-surface rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-text-muted">Live Dashboard Preview</span>
                  <span className="flex items-center text-xs font-medium text-success">
                    <span className="animate-pulse mr-1">●</span>
                    Active
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="h-3 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-full w-3/4"></div>
                  <div className="h-3 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-full w-full"></div>
                  <div className="h-3 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-full w-5/6"></div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-success/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-success">87%</div>
                      <div className="text-xs text-text-muted mt-1">Accuracy</div>
                    </div>
                    <div className="bg-sevensa-teal/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-sevensa-teal">12</div>
                      <div className="text-xs text-text-muted mt-1">Certificates</div>
                    </div>
                    <div className="bg-warning/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-warning">3</div>
                      <div className="text-xs text-text-muted mt-1">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white dark:bg-dark-bg-surface py-20 border-y border-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-4">
              Waarom Sevensa PSRA-LTSD?
            </h2>
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
              We combineren AI-expertise met diepgaande trade compliance kennis voor meetbare resultaten.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-bg-surface dark:from-dark-bg-base dark:to-dark-bg-muted p-8 rounded-2xl border border-border dark:border-dark-border shadow-card hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-sevensa-teal" />
              </div>
              <h3 className="text-xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3">
                Snelle ROI
              </h3>
              <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
                Binnen 90 dagen ziet u al rendement op uw AI-investering met meetbare bedrijfswaarde en geoptimaliseerde processen.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">78.5% manuren reductie</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Geautomatiseerde compliance</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-bg-surface dark:from-dark-bg-base dark:to-dark-bg-muted p-8 rounded-2xl border border-border dark:border-dark-border shadow-card hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-sevensa-teal" />
              </div>
              <h3 className="text-xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3">
                Ethische AI
              </h3>
              <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
                Transparantie en privacy staan voorop. We garanderen GDPR-compliance en explainable AI bij elke beslissing.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">GDPR-compliant</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Explainable AI dashboard</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-bg-surface dark:from-dark-bg-base dark:to-dark-bg-muted p-8 rounded-2xl border border-border dark:border-dark-border shadow-card hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-sevensa-teal" />
              </div>
              <h3 className="text-xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3">
                Multi-Persona
              </h3>
              <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
                Elke rol krijgt een op maat gemaakte interface: van compliance manager tot CFO en supplier.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Role-based dashboards</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Collaborative workflows</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section id="personas" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-4">
            Kies je rol
          </h2>
          <p className="text-lg text-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
            Elke persona krijgt een tailored experience, ontworpen voor jouw specifieke behoeften en workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Compliance Manager Card */}
          <Link
            href="/dashboard"
            className="group bg-white dark:bg-dark-bg-surface rounded-2xl border-2 border-border dark:border-dark-border hover:border-sevensa-teal dark:hover:border-sevensa-teal p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-2xl flex items-center justify-center group-hover:bg-sevensa-teal group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl group-hover:scale-110 transition-transform">👩‍💼</span>
              </div>
              <ArrowRight className="w-6 h-6 text-text-muted group-hover:text-sevensa-teal group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <h3 className="text-2xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3 group-hover:text-sevensa-teal transition-colors">
              Compliance Manager
            </h3>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
              Bekijk recente assessments, start een Origin Check, maak LTSD-certificaten aan en vraag ontbrekende CoO's uit.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Assessments
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Certificates
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Compliance
              </span>
            </div>
          </Link>

          {/* CFO Card */}
          <Link
            href="/cfo"
            className="group bg-white dark:bg-dark-bg-surface rounded-2xl border-2 border-border dark:border-dark-border hover:border-sevensa-teal dark:hover:border-sevensa-teal p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-2xl flex items-center justify-center group-hover:bg-sevensa-teal group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              </div>
              <ArrowRight className="w-6 h-6 text-text-muted group-hover:text-sevensa-teal group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <h3 className="text-2xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3 group-hover:text-sevensa-teal transition-colors">
              CFO / Manager
            </h3>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
              Zie savings, risico's en approvals in één oogopslag. Neem razendsnel data-driven beslissingen met realtime insights.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                ROI Insights
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Risk Overview
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Approvals
              </span>
            </div>
          </Link>

          {/* Supplier Card */}
          <Link
            href="/supplier"
            className="group bg-white dark:bg-dark-bg-surface rounded-2xl border-2 border-border dark:border-dark-border hover:border-sevensa-teal dark:hover:border-sevensa-teal p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-sevensa-teal-100 dark:bg-sevensa-teal-900/30 rounded-2xl flex items-center justify-center group-hover:bg-sevensa-teal group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
              </div>
              <ArrowRight className="w-6 h-6 text-text-muted group-hover:text-sevensa-teal group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <h3 className="text-2xl font-bold text-sevensa-dark dark:text-dark-text-primary mb-3 group-hover:text-sevensa-teal transition-colors">
              Supplier
            </h3>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-4">
              Upload Certificates of Origin per grondstof, track status en maak de supply chain compleet. Simpel en snel.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Upload CoO
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Status Tracking
              </span>
              <span className="px-3 py-1 bg-sevensa-teal-50 dark:bg-sevensa-teal-900/20 text-sevensa-teal text-xs font-semibold rounded-full">
                Notifications
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sevensa-dark text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <Image
                src="/sevensa_logo_variation_2_white.png"
                alt="Sevensa"
                width={140}
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-white/70 text-sm max-w-md">
                Ethische, op maat gemaakte AI-oplossingen die meetbare bedrijfswaarde en snelle ROI leveren voor B2B-organisaties.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/dashboard" className="hover:text-sevensa-teal transition-colors">Compliance Manager</Link></li>
                <li><Link href="/cfo" className="hover:text-sevensa-teal transition-colors">CFO Dashboard</Link></li>
                <li><Link href="/supplier" className="hover:text-sevensa-teal transition-colors">Supplier Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>admin@sevensa.nl</li>
                <li>+31 (0) 20 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
            © 2025 Sevensa. Alle rechten voorbehouden. | <Link href="#" className="hover:text-sevensa-teal transition-colors">Privacy</Link> | <Link href="#" className="hover:text-sevensa-teal transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Shield, Brain, Link2, Users, Search, FileDown, GitMerge, Network2, AlertTriangle, FileCheck, History, Webhook } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const features = [
  {
    icon: Shield,
    title: 'Origin Check',
    description: 'Verify and validate product origins with our advanced authentication system',
    href: '/#tour'
  },
  {
    icon: Brain,
    title: 'XAI Explainer',
    description: 'Transparent AI decisions with detailed explanations of verification results',
    href: '/#xai'
  },
  {
    icon: Link2,
    title: 'Closed-Chain CoO',
    description: 'End-to-end chain of custody tracking with blockchain verification',
    href: '/#chain'
  },
  {
    icon: Users,
    title: 'Multi-Persona Dashboards',
    description: 'Role-specific views and controls for different user types',
    href: '/#personas'
  },
  {
    icon: Search,
    title: 'Real-time Search',
    description: 'Lightning-fast global search across all data (⌘K)',
    href: '#'
  },
  {
    icon: FileDown,
    title: 'Export Options',
    description: 'Export data in PDF, JSON, and CSV formats with one click',
    href: '#'
  },
  {
    icon: GitMerge,
    title: 'Approval Workflows',
    description: 'Customizable multi-step approval processes for changes',
    href: '#'
  },
  {
    icon: Network2,
    title: 'BOM Visualization',
    description: 'Interactive tree visualization of bill of materials',
    href: '#'
  },
  {
    icon: AlertTriangle,
    title: 'Risk Analysis',
    description: 'Proactive risk assessment and mitigation recommendations',
    href: '#'
  },
  {
    icon: FileCheck,
    title: 'Compliance Reports',
    description: 'Automated compliance reporting for major regulations',
    href: '#'
  },
  {
    icon: History,
    title: 'Audit Trail',
    description: 'Complete history of all system actions and changes',
    href: '#'
  },
  {
    icon: Webhook,
    title: 'API Integration',
    description: 'Robust API endpoints for seamless system integration',
    href: '#'
  }
]

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/features' }
        ]}
        className="mb-8"
      />

      <h1 className="text-4xl font-bold text-gray-900 mb-12">
        Features
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={feature.href}>
              <div className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 h-full">
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {feature.description}
                </p>
                <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform duration-200">
                  Learn More
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
```
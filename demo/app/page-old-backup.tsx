```tsx
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ChevronRight, ArrowRight, Upload, Database, Shield, Users } from 'lucide-react';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('compliance');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Sticky Header */}
      <header className={`fixed w-full px-6 py-4 transition-all duration-200 z-50 ${
        scrolled ? 'bg-slate-900/80 backdrop-blur-lg border-b border-slate-700' : ''
      }`}>
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <img src="/logo.svg" alt="PSRA" className="h-8" />
          <div className="hidden md:flex space-x-8">
            <a href="#tour" className="hover:text-teal-400">Quick Tour</a>
            <a href="#chain" className="hover:text-teal-400">Chain</a>
            <a href="#xai" className="hover:text-teal-400">XAI</a>
            <a href="#personas" className="hover:text-teal-400">Personas</a>
          </div>
          <button className="bg-teal-500 hover:bg-teal-400 px-4 py-2 rounded-lg">
            Try Production →
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="tour" className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-12 bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Experience AI-Powered Trade Compliance in 60 Seconds
          </h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Origin Check',
                desc: 'Verify product origins across your supply chain',
                icon: <Database className="h-8 w-8" />
              },
              {
                title: 'XAI Explainer',
                desc: 'Understand AI decisions with full transparency',
                icon: <Shield className="h-8 w-8" />
              },
              {
                title: 'Audit Pack',
                desc: 'Generate compliance documentation instantly',
                icon: <Users className="h-8 w-8" />
              }
            ].map((card, i) => (
              <div key={i} className="bg-gradient-to-br from-teal-500/20 to-transparent p-8 rounded-xl backdrop-blur-sm border border-teal-500/20 hover:border-teal-400/40 transition-all">
                {card.icon}
                <h3 className="text-xl font-bold mt-4">{card.title}</h3>
                <p className="mt-2 text-slate-300">{card.desc}</p>
                <button className="mt-6 flex items-center text-teal-400 hover:text-teal-300">
                  Try Demo <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chain Section */}
      <section id="chain" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Volledige BOM-Keten Tracking</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="relative p-8 bg-slate-900/50 rounded-xl border border-slate-700">
              {/* Tree Diagram */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-teal-400" />
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div className="grid grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-teal-400" />
                      </div>
                      <div className="w-px h-8 bg-slate-700" />
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        {i === 1 ? 
                          <AlertTriangle className="h-6 w-6 text-amber-400" /> :
                          <CheckCircle className="h-6 w-6 text-teal-400" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Add CoO Wizard</h3>
                <div className="space-y-4">
                  <button className="w-full p-4 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center">
                    <Upload className="h-5 w-5 mr-3" /> Select Files
                  </button>
                  <button className="w-full p-4 bg-teal-500/20 rounded-lg hover:bg-teal-500/30 text-teal-400">
                    Complete <ArrowRight className="inline h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* XAI Section */}
      <section id="xai" className="py-20 px-6">
        {/* Similar structure for XAI section */}
      </section>

      {/* Personas Section */}
      <section id="personas" className="py-20 px-6 bg-slate-800/50">
        {/* Similar structure for Personas section */}
      </section>

      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400">© 2024 Sevensa</div>
          <div className="flex space-x-8 text-slate-400">
            <a href="/features" className="hover:text-white">Features</a>
            <a href="/tech" className="hover:text-white">Technology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

Note: This is a simplified version focusing on the core structure and key sections. You'll need to:
1. Add Tailwind CSS configuration
2. Complete the XAI and Personas sections following similar patterns
3. Add actual content and refine styling
4. Implement smooth scrolling and animations
5. Add proper types for props/state
6. Add actual logo and assets

The code demonstrates the layout structure, styling approach, and component organization. The full implementation would need additional sections and refinements.
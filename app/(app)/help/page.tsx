'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

const faqs = {
  'Getting Started': [
    {
      q: 'How do I get started with Sevensa?',
      a: 'Create an account, verify your email, and complete your profile. You can then start creating assessments or join existing ones.'
    },
    {
      q: 'What are the system requirements?',
      a: 'Sevensa works on all modern browsers. We recommend using Chrome, Firefox, or Safari for the best experience.'
    }
  ],
  'Creating Assessments': [
    {
      q: 'How do I create a new assessment?',
      a: 'Click the "Create Assessment" button on your dashboard, fill in the basic details, and follow the step-by-step wizard to set up your assessment criteria.'
    },
    {
      q: 'Can I use templates?',
      a: 'Yes! We offer various assessment templates that you can customize according to your needs.'
    }
  ],
  'Exporting Data': [
    {
      q: 'What export formats are supported?',
      a: 'You can export assessments in PDF, Excel, CSV, and JSON formats. Premium users have access to additional formats.'
    },
    {
      q: 'Can I customize export templates?',
      a: 'Yes, premium users can create and save custom export templates with their branding.'
    }
  ],
  'Troubleshooting': [
    {
      q: 'What should I do if my assessment fails to save?',
      a: 'First check your internet connection, then try refreshing the page. If the issue persists, contact support.'
    },
    {
      q: 'Why cannot I access certain features?',
      a: 'Some features are limited to premium users. Check your subscription status in account settings.'
    }
  ]
};

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filterFaqs = (query: string) => {
    if (!query) return faqs;

    const filtered: Record<string, typeof faqs[keyof typeof faqs]> = {};

    Object.entries(faqs).forEach(([category, questions]) => {
      const matchingQuestions = questions.filter(
        (faq) =>
          faq.q.toLowerCase().includes(query.toLowerCase()) ||
          faq.a.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingQuestions.length > 0) {
        filtered[category] = matchingQuestions;
      }
    });

    return filtered;
  };

  const filteredFaqs = filterFaqs(searchQuery);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-lg text-gray-600">
          Find answers to common questions and learn how to get the most out of Sevensa.
        </p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
          />
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(filteredFaqs).map(([category, questions]) => (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === category ? null : category)
              }
              className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
            >
              <h2 className="text-xl font-semibold">{category}</h2>
              <span className="text-gray-500">{expandedCategory === category ? '−' : '+'}</span>
            </button>

            {expandedCategory === category && (
              <div className="px-6 py-4 space-y-4">
                {questions.map((faq, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
        <p className="text-gray-600 mb-4">
          Cannot find what you are looking for? Our support team is here to help.
        </p>
        <button className="px-6 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}

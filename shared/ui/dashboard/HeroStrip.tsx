'use client';

import { CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Assessment {
  id: string;
  productName: string;
  verdict: 'GO' | 'NO_GO' | 'PENDING';
  createdAt: string;
}

export function HeroStrip() {
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    fetch('/api/assessments')
      .then(res => res.json())
      .then(data => setRecentAssessments(data.slice(0, 3)))
      .catch(console.error);
  }, []);

  const verdictColor = (verdict: string) => {
    switch (verdict) {
      case 'GO': return 'text-success bg-success/10';
      case 'NO_GO': return 'text-error bg-error/10';
      case 'PENDING': return 'text-warning bg-warning/10';
      default: return 'text-text-muted bg-bg-muted';
    }
  };

  return (
    <div className="bg-gradient-to-r from-sevensa-teal to-sevensa-teal-600 rounded-2xl p-8 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-3xl font-bold mb-2">Welkom, Compliance Manager! 👩‍💼</h1>
          <p className="text-white/90 text-lg">
            Start een nieuwe Origin Check, bekijk recente assessments, of maak LTSD-certificaten aan.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {recentAssessments.map((assessment, i) => (
            <div key={assessment.id} className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center space-x-3">
              <div>
                <div className="text-sm font-semibold">{assessment.productName.substring(0, 20)}...</div>
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${verdictColor(assessment.verdict)}`}>
                  {assessment.verdict}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

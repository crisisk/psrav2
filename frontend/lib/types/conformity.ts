// Type definitions for Conformity Assessment feature

export interface ConformityAssessment {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  assessmentDate: Date;
  updatedAt: Date;
  standard: string;
  organization: string;
}

export type ResultsResponse = {
  data?: ConformityAssessment[];
  error?: string;
};

export const StatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
} as const;
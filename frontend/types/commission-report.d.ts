export interface CommissionReport {
  id: string;
  assessmentId: string;
  commissioner: string;
  reportDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  findings: string;
  recommendations: string;
}

export interface CommissionReportApiResponse {
  data?: CommissionReport;
  error?: string;
}

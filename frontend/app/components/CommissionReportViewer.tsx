import React from 'react';

interface CommissionReportViewerProps {
  reportId: string;
}

interface ApiResponse {
  data?: {
    id: string;
    assessmentId: string;
    commissioner: string;
    reportDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    findings: string;
    recommendations: string;
  };
  error?: string;
}

export default async function CommissionReportViewer({
  reportId,
}: CommissionReportViewerProps) {
  let report: ApiResponse['data'] | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/commission-reports/${reportId}`
    );

    if (!response.ok) {
      errorMessage = `Failed to fetch report: ${response.statusText}`;
    } else {
      const data: ApiResponse = await response.json();
      if (data.error) {
        errorMessage = data.error;
      } else {
        report = data.data;
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
    errorMessage = 'Failed to load commission report';
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      {errorMessage ? (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
          {errorMessage}
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              Commission Report: {report.assessmentId}
            </h1>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p>Report ID: {report.id}</p>
                <p>Commissioner: {report.commissioner}</p>
              </div>
              <div>
                <p>Report Date: {new Date(report.reportDate).toLocaleDateString()}</p>
                <p
                  className={`inline-block px-2 py-1 rounded ${
                    report.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : report.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  Status: {report.status}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">Key Findings</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{report.findings}</p>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">
                Recommendations
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {report.recommendations}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-32 text-gray-500">
          Loading report...
        </div>
      )}
    </div>
  );
}

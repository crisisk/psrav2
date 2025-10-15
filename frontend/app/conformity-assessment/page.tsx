import { AssessmentForm } from '@/components/AssessmentForm';

export default async function ConformityAssessmentPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conformity-assessments`);
  const { data: assessments } = await response.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Conformity Assessment Tracker</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">New Assessment</h2>
        <AssessmentForm />
      </div>

      {assessments?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Existing Assessments</h2>
          <div className="space-y-4">
            {assessments.map((assessment: any) => (
              <div key={assessment.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium">Project ID: {assessment.projectId}</h3>
                <p className="text-sm text-gray-600">
                  Overall Compliance: {assessment.overallCompliance ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

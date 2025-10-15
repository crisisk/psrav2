import { Assessment } from '@/lib/validations/assessment';

export async function AssessmentList() {
  let assessments: Assessment[] = [];

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessments`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    assessments = data.data;
  } catch (error) {
    console.error('Fetch error:', error);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Assessments</h2>
      {assessments.length === 0 ? (
        <p className="text-gray-500">No assessments found</p>
      ) : (
        <div className="space-y-2">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="p-4 bg-white shadow rounded-lg"
            >
              <h3 className="font-semibold">{assessment.name}</h3>
              <p className="text-sm text-gray-600">
                Status: {assessment.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

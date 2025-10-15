import AssessmentsList from '@/components/AssessmentsList';

export default async function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conformity Assessment Tracker</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <AssessmentsList />
        </div>
      </div>
    </main>
  );
}

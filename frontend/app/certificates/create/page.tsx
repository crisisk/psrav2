import Link from 'next/link';

export default function CertificateCreationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Certificate Creation</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">Certificate creation form goes here</p>
        
        <Link
          href="/audit-logs"
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Back to Audit Logs
        </Link>
      </div>
    </div>
  );
}

import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Sevensa',
  description: 'Privacy policy and data protection information for Sevensa PSRA-LTSD',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Shield className="h-8 w-8 mr-3 text-sevensa-teal" />
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
      </div>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Collection</h2>
          <p>
            Sevensa collects only the data necessary to provide our services. This includes:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Account information (name, email, company details)</li>
            <li>Assessment data (product information, HS codes, trade agreements)</li>
            <li>Usage analytics (anonymized)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Usage</h2>
          <p>
            We use your data to:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Provide and improve our services</li>
            <li>Process your origin assessments</li>
            <li>Send important notifications about your assessments</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">GDPR Compliance</h2>
          <p>
            Sevensa is fully compliant with the General Data Protection Regulation (GDPR). You have the right to:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Encryption in transit and at rest</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
            <li>Secure backup procedures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            For privacy-related inquiries, please contact us at:
            <br />
            <a href="mailto:privacy@sevensa.nl" className="text-sevensa-teal hover:underline">
              privacy@sevensa.nl
            </a>
          </p>
        </section>

        <section className="text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
}

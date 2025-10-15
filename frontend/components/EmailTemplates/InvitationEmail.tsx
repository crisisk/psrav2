import React from 'react';

interface InvitationEmailProps {
  inviterName: string;
  companyName: string;
  inviteLink: string;
}

export default function InvitationEmail({
  inviterName,
  companyName,
  inviteLink,
}: InvitationEmailProps) {
  return (
    <div className="bg-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Email Header */}
        <div className="flex items-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg" />
          <h1 className="ml-4 text-2xl font-bold text-gray-900">{companyName}</h1>
        </div>

        {/* Email Content */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Hello there,
          </p>
          <p className="text-gray-700 mb-6">
            {inviterName} has invited you to join {companyName} on our platform.
            Click the button below to accept this invitation and get started.
          </p>
          <a
            href={inviteLink}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg
                     hover:bg-blue-700 transition-colors duration-200"
          >
            Accept Invitation
          </a>
        </div>

        {/* Email Footer */}
        <div className="border-t border-gray-200 pt-8 text-gray-600 text-sm">
          <p>This invitation was sent by {inviterName} on behalf of {companyName}.</p>
          <p className="mt-2">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  );
}

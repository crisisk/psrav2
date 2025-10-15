import * as React from 'react';

interface InvitationEmailProps {
  senderName: string;
  invitationLink: string;
}

export const InvitationEmail = ({ senderName, invitationLink }: InvitationEmailProps) => {
  return (
    <html>
      <body className="bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Conformity Assessment Tracker</h1>
          </div>

          <p className="text-gray-700 mb-4">Hello,</p>
          <p className="text-gray-700 mb-6">
            {senderName} has invited you to join the Conformity Assessment Tracker platform.
          </p>
          
          <a
            href={invitationLink}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accept Invitation
          </a>

          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Conformity Assessment Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  );
};

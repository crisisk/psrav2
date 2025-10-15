import Link from 'next/link';
import { type ReactElement } from 'react';

interface CertificateLinkProps {
  id: string;
  children: React.ReactNode;
}

export default function CertificateLink({
  id,
  children,
}: CertificateLinkProps): ReactElement {
  return (
    <Link
      href={`/certificates/${id}`}
      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
      prefetch={false}
    >
      {children}
    </Link>
  );
}

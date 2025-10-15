import Link from 'next/link';

interface CertificateEditLinkProps {
  certificateId: string;
  className?: string;
}

export default function CertificateEditLink({
  certificateId,
  className = ''
}: CertificateEditLinkProps) {
  return (
    <Link
      href={`/certificates/${encodeURIComponent(certificateId)}/edit`}
      className={`px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${className}`}
      aria-label={`Edit certificate ${certificateId}`}
    >
      Edit Certificate
    </Link>
  );
}
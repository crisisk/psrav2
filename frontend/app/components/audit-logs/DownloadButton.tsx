'use client';

export const DownloadAuditLogButton = () => {
  const handleDownload = () => {
    try {
      // Programmatically trigger download
      const link = document.createElement('a');
      link.href = '/api/audit-logs/export';
      link.download = 'audit-logs.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Consider adding user feedback here
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="ml-4 inline-flex items-center rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors"
      aria-label="Download audit logs"
    >
      <svg
        className="mr-2 h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Export CSV
    </button>
  );
};

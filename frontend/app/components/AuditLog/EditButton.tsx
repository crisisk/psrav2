import { FaPencilAlt } from 'react-icons/fa';

interface EditButtonProps {
  auditLogId: string;
  onEdit: (id: string) => void;
}

export const EditButton = ({ auditLogId, onEdit }: EditButtonProps) => {
  return (
    <button
      onClick={() => onEdit(auditLogId)}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Edit audit log entry"
    >
      <FaPencilAlt className="w-4 h-4 text-gray-600" />
    </button>
  );
};

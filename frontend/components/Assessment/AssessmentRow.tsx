import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from '@/lib/toast';

interface AssessmentRowProps {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  initialVisible: boolean;
}

export function AssessmentRow({
  id,
  name,
  status,
  date,
  initialVisible,
}: AssessmentRowProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/assessments/${id}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visible: newVisibility }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      setIsVisible(newVisibility);
      toast.success(`Visibility ${newVisibility ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility settings');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">{name}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-sm ${{
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        }[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{date}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={handleToggleVisibility}
          disabled={isUpdating}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label={isVisible ? 'Hide details' : 'Show details'}
        >
          {isVisible ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </td>
    </tr>
  );
}

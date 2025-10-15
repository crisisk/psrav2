'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Props = {
  selectedIds: string[];
  onDeleteSuccess?: () => void;
};

export function AuditLogDeleteButton({ selectedIds, onDeleteSuccess }: Props) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedIds.length) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete logs');
      }

      toast({
        title: 'Success',
        description: `Deleted ${selectedIds.length} audit logs`,
        variant: 'success',
      });

      onDeleteSuccess?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete audit logs',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="danger"
      onClick={handleDelete}
      disabled={isDeleting || !selectedIds.length}
      className="gap-2"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Delete Selected{selectedIds.length ? ` (${selectedIds.length})` : ''}
    </Button>
  );
}

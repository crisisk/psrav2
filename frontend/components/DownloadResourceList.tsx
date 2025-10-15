'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';

type Resource = {
  id: string;
  name: string;
  description: string;
};

export function DownloadResourceList({ resources }: { resources: Resource[] }) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDownload = async (resourceId: string) => {
    try {
      setLoadingId(resourceId);
      
      const response = await fetch(`/api/resources/${resourceId}/download`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resourceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      toast({
        variant: 'error',
        title: 'Download Error',
        description: error instanceof Error ? error.message : 'Failed to download resource',
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="p-4 border rounded-lg flex justify-between items-center bg-card"
        >
          <div>
            <h3 className="font-semibold text-primary">{resource.name}</h3>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          </div>
          <Button
            onClick={() => handleDownload(resource.id)}
            disabled={!!loadingId}
            variant="outline"
          >
            {loadingId === resource.id ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      ))}
    </div>
  );
}

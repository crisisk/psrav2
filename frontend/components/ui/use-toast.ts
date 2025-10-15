import { useCallback } from 'react';

export function useToast() {
  const toastFunc = useCallback(({ title, description, variant }: { title: string, description: string, variant: 'success' | 'error' | 'info' }) => {
    console.log(`Toast: ${variant} - ${title}: ${description}`);
  }, []);

  return { toast: toastFunc };
}

// Standalone toast function for non-hook usage
export const toast = ({ title, description, variant }: { title: string, description: string, variant?: 'success' | 'error' | 'info' }) => {
  console.log(`Toast: ${variant || 'info'} - ${title}: ${description}`);
};

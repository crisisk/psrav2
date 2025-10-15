"use client";

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

interface ModelPreferenceToggleProps {
  initialModel: string;
  initialEnabled: boolean;
}

export function ModelPreferenceToggle({
  initialModel,
  initialEnabled
}: ModelPreferenceToggleProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName: initialModel,
          isEnabled: newValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setIsEnabled(newValue);
      toast({
        title: 'Preferences updated',
        description: `${initialModel} model preference changed`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update model preferences',
        variant: 'error'
      });
      setIsEnabled(!newValue); // Revert UI state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium">{initialModel} Model</h3>
        <p className="text-sm text-muted-foreground">
          Toggle to enable/disable this model
        </p>
      </div>
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isSubmitting}
        aria-label="Toggle model"
      />
    </div>
  );
}

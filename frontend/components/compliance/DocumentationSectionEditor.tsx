'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ApiClient } from '@/lib/api-client';
import { DocumentationSection } from '@/types/compliance';

export default function DocumentationSectionEditor({
  sectionId,
}: {
  sectionId: string;
}) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState(1);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const response = await ApiClient.get(`/compliance/documentation/${sectionId}`);
        const data: DocumentationSection = response as DocumentationSection;
        setContent(data.content);
        setCurrentVersion(data.version!);
      } catch (error) {
        toast.error('Failed to load section');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSection();
  }, [sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await ApiClient.put(
        `/compliance/documentation/${sectionId}`,
        {
          content,
          version: currentVersion + 1,
        }
      );

      

      const updatedData: DocumentationSection = response as DocumentationSection;
      setCurrentVersion(updatedData.version!);
      toast.success('Documentation updated successfully');
    } catch (error) {
      toast.error('Failed to update documentation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documentation Content (Version {currentVersion})
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={8}
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

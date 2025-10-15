'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

type FormValues = z.infer<typeof assessmentSchema>;

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(assessmentSchema),
  });

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/assessments');
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setAssessments(data);
      } catch (err) {
        setError('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Submission failed');

      const newAssessment = await response.json();
      setAssessments([...assessments, newAssessment]);
      reset();
    } catch (err) {
      setError('Failed to submit assessment');
    }
  };

  if (loading) return <div className='p-4 text-gray-500'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>{error}</div>;

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <form onSubmit={handleSubmit(onSubmit)} className='mb-8 space-y-4'>
        <div>
          <input
            {...register('title')}
            placeholder='Assessment title'
            className='w-full p-2 border rounded'
          />
          {errors.title && (
            <p className='text-red-500 text-sm'>{errors.title.message}</p>
          )}
        </div>
        <div>
          <input
            type='datetime-local'
            {...register('dueDate')}
            className='w-full p-2 border rounded'
          />
          {errors.dueDate && (
            <p className='text-red-500 text-sm'>{errors.dueDate.message}</p>
          )}
        </div>
        <button
          type='submit'
          className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
        >
          Add Assessment
        </button>
      </form>

      <div className='space-y-2'>
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className='p-4 border rounded-lg hover:bg-gray-50'
          >
            <h3 className='font-medium'>{assessment.title}</h3>
            <p className='text-sm text-gray-500'>
              Due: {new Date(assessment.dueDate).toLocaleDateString()}
            </p>
            <span className='text-sm text-blue-500'>{assessment.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

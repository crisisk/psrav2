import { AssessmentSchema } from '@/lib/validations/assessment'
import { z } from 'zod'

interface AssessmentsTableProps {
  initialData?: z.infer<typeof AssessmentSchema>[]
}

export async function AssessmentsTable({ initialData }: AssessmentsTableProps) {
  let data: z.infer<typeof AssessmentSchema>[] = []
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessments`, {
      cache: 'no-store'
    })
    
    if (!response.ok) throw new Error('Failed to fetch')
    
    const result = await response.json()
    data = AssessmentSchema.array().parse(result.data)
  } catch (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading assessments. Please try again later.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((assessment) => (
            <tr key={assessment.id}>
              <td className="px-6 py-4 whitespace-nowrap">{assessment.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  assessment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {assessment.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{assessment.dueDate}</td>
              <td className="px-6 py-4 whitespace-nowrap">{assessment.assignedTo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

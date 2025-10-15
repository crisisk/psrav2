'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export interface Section {
  id: string
  name: string
  description: string
  createdAt: Date
}

interface ApiResponse {
  success?: boolean
  error?: string
}

interface Props {
  sections: Section[]
}

export function SectionManagement({ sections }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return

    setDeletingId(sectionId)

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete section')
      }

      toast.success('Section deleted successfully')
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Section Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-auto">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr
                key={section.id}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">{section.name}</td>
                <td className="px-4 py-3">{section.description}</td>
                <td className="px-4 py-3">
                  {new Date(section.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(section.id)}
                    disabled={deletingId === section.id}
                    className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === section.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

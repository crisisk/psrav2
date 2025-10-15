import { Menu } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { AuditLog } from '@/lib/types/audit-log'

type Props = {
  auditLogId: string
}

export default function ActionDropdown({ auditLogId }: Props) {
  const handleAction = async (action: 'details' | 'export') => {
    try {
      const endpoint = `/api/audit-logs/${auditLogId}/${action}`
      const response = await fetch(endpoint, { method: 'POST' })
      
      if (!response.ok) {
        throw new Error(`Action failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Action successful:', data)
    } catch (error) {
      console.error('Error performing action:', error)
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Audit log actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
      </Menu.Button>

      <Menu.Items
        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => handleAction('details')}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } flex w-full px-4 py-2 text-sm`}
              >
                View Details
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => handleAction('export')}
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } flex w-full px-4 py-2 text-sm`}
              >
                Export Entry
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  )
}

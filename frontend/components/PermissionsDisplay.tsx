'use client'
import { useEffect, useState } from 'react'
import { UserTier } from '@/lib/permissions'

type PermissionResponse = {
  allowedPermissions: string[]
  userTier: UserTier
}

export default function PermissionsDisplay() {
  const [permissions, setPermissions] = useState<PermissionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/permissions')
        if (!response.ok) {
          throw new Error('Failed to fetch permissions')
        }
        const data: PermissionResponse = await response.json()
        setPermissions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  if (loading) {
    return <div className="p-4 text-gray-600">Loading permissions...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Your Permissions (Tier {permissions?.userTier})
      </h2>
      <ul className="space-y-2">
        {permissions?.allowedPermissions.map((permission) => (
          <li
            key={permission}
            className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700 capitalize">{permission}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

type DeletableStatus = {
  deletable: boolean
  reasons: {
    isApproved: boolean
    hasShipments: boolean
  }
}

export default function CertificateDeletableStatus({
  certificateId
}: {
  certificateId: string
}) {
  const [status, setStatus] = useState<DeletableStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkDeletability = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/certificates/${certificateId}/deletable`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to check deletability')
        }

        const data: DeletableStatus = await response.json()
        setStatus(data)
      } catch (err) {
        console.error('Deletability check failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkDeletability()
  }, [certificateId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking deletability...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p className="font-medium">Error checking deletability:</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!status?.deletable) {
    return (
      <div className="space-y-2 rounded-md bg-yellow-50 p-4 text-yellow-800">
        <h3 className="font-medium">Cannot delete certificate because:</h3>
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {status?.reasons.isApproved && (
            <li>Certificate has been approved</li>
          )}
          {status?.reasons.hasShipments && (
            <li>Certificate is linked to existing shipments</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="rounded-md bg-green-50 p-4 text-green-700">
      <p className="font-medium">This certificate can be safely deleted</p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Icons } from '@/components/icons'

// Type definitions for props
interface OnboardingTriggerProps {
  workflowType: 'NEW_ASSESSMENT' | 'SUPPLIER_ONBOARDING'
  entityId: string
}

// Response schema validation
const workflowResponseSchema = z.object({
  workflow: z.object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    steps: z.array(z.object({
      stepName: z.string(),
      order: z.number()
    }))
  })
})

export function OnboardingTriggerButton({
  workflowType,
  entityId
}: OnboardingTriggerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const triggerWorkflow = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/onboarding/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowType, entityId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to trigger workflow')
      }

      const data = await response.json()
      workflowResponseSchema.parse(data) // Validate response shape
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Trigger workflow failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={triggerWorkflow}
        disabled={isLoading || success}
        className="w-48 justify-center"
        variant={success ? 'primary' : 'primary'}
      >
        {isLoading ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : success ? (
          'Workflow Started!'
        ) : (
          'Start Onboarding'
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

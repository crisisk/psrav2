import { Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/shared/lib/telemetry'
import { useQuery, useMutation } from '@tanstack/react-query'

type ChainNode = {
  id: string
  description: string
  hsCode?: string
  originCountry?: string
  hasCoo: boolean
}

export function MissingCooList({ ltsdId }: { ltsdId: string }) {
  const [requestingNodes, setRequestingNodes] = useState<string[]>([])

  const { data: chainNodes = [] } = useQuery<ChainNode[]>({
    queryKey: ['chain', ltsdId],
    queryFn: () => fetch(`/api/chain/${ltsdId}`).then(res => res.json())
  })

  const requestCooMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await fetch(`/api/chain/${ltsdId}/node/${nodeId}/request-coo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierEmail: 'test@test.com' })
      })
    },
    onMutate: (nodeId) => {
      setRequestingNodes(prev => [...prev, nodeId])
    },
    onSuccess: (_, nodeId) => {
      toast.success('CoO aanvraag verstuurd!')
      trackEvent('coo_request_sent', { nodeId, ltsdId })
    },
    onSettled: (_, __, nodeId) => {
      setRequestingNodes(prev => prev.filter(id => id !== nodeId))
    }
  })

  const missingCooNodes = chainNodes.filter(node => !node.hasCoo)

  if (missingCooNodes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Alle CoO's compleet ✓
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {missingCooNodes.map(node => (
        <div 
          key={node.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg border"
        >
          <div>
            <p className="font-medium">{node.description}</p>
            <div className="text-sm text-gray-500 space-x-4">
              {node.hsCode && <span>HS: {node.hsCode}</span>}
              {node.originCountry && <span>Origin: {node.originCountry}</span>}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={requestingNodes.includes(node.id)}
            onClick={() => requestCooMutation.mutate(node.id)}
          >
            <Mail className="w-4 h-4 mr-2" />
            {requestingNodes.includes(node.id) ? 'Versturen...' : 'Vraag CoO aan'}
          </Button>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { RotateCcw, Loader2, Copy } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  useScenarioScriptQuery,
  useRegenerateTestScriptsMutation,
} from '@/utils/queries/scenarioQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocketContext } from '@/contexts/WebSocketProvider'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: number | null
}

export function ViewTestScriptSheet({ open, onOpenChange, scenarioId }: Props) {
  const queryClient = useQueryClient()
  const { lastMessage } = useWebSocketContext()

  const { data, isLoading, isError, isFetching } = useScenarioScriptQuery(open ? scenarioId : null)

  const { mutate: regenerateScript } = useRegenerateTestScriptsMutation()

  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = () => {
    if (!scenarioId || isRegenerating) return

    setIsRegenerating(true)

    regenerateScript(scenarioId, {
      onError: () => {
        toast.error('Failed to start script regeneration')
        setIsRegenerating(false)
      },
    })
  }

  const handleCopyScript = async () => {
    if (!data?.script) return

    try {
      await navigator.clipboard.writeText(data.script)
      toast.success('Test script copied to clipboard')
    } catch {
      toast.error('Failed to copy script')
    }
  }

  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type !== 'PAGE_STATUS_UPDATE') return

    const { scenario_id, status } = lastMessage.payload

    if (scenario_id !== scenarioId) return

    if (status === 'done') {
      setIsRegenerating(false)

      queryClient.invalidateQueries({
        queryKey: ['scenario-script', scenarioId],
      })

      toast.success('Test script generation completed')
    } else if (status === 'generating_test_scripts') {
      setIsRegenerating(true)
    }
  }, [lastMessage, scenarioId, queryClient])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
    !w-[40vw] !max-w-none p-0 flex flex-col
    **:data-[slot=sheet-close]:text-red-500
    **:data-[slot=sheet-close]:hover:text-red-600
    **:data-[slot=sheet-close]:opacity-100
    [&_[data-slot=sheet-close]_svg]:w-6
    [&_[data-slot=sheet-close]_svg]:h-6
  "
      >
        {/* Header */}
        <div className="flex items-center justify-between pl-6 pr-14 py-3 border-b">
          <h2 className="text-xl font-semibold">View Test Script</h2>
          {data?.script && (
            <Button
              variant="outline"
              onClick={handleCopyScript}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              Copy Script
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="border rounded-lg bg-gray-50 p-4 min-h-[400px]">
            {isLoading || isFetching ? (
              <div className="text-sm text-muted-foreground">Loading test script...</div>
            ) : isError ? (
              <div className="text-sm text-red-500">Failed to load test script.</div>
            ) : (
              <pre className="whitespace-pre-wrap break-words text-sm font-mono leading-relaxed">
                {data?.script || 'No script available'}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="text-red-600 hover:text-red-700 cursor-pointer flex items-center gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Regenerate Test Script
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

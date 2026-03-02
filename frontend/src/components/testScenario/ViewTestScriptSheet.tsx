import { RotateCcw } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useScenarioScriptQuery } from '@/utils/queries/scenarioQueries'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: number | null
}

export function ViewTestScriptSheet({ open, onOpenChange, scenarioId }: Props) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, isFetching } = useScenarioScriptQuery(open ? scenarioId : null)

  const handleRegenerate = async () => {
    if (!scenarioId) return

    //  Later call regenerate API here

    // For now just refetch script
    queryClient.invalidateQueries({
      queryKey: ['scenario-script', scenarioId],
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
          w-[750px] sm:w-[850px] p-0 flex flex-col
          **:data-[slot=sheet-close]:text-red-500
          **:data-[slot=sheet-close]:hover:text-red-600
          **:data-[slot=sheet-close]:opacity-100
          [&_[data-slot=sheet-close]_svg]:w-6
          [&_[data-slot=sheet-close]_svg]:h-6
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h2 className="text-xl font-semibold">View Test Script</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="border rounded-lg bg-gray-50 p-4 min-h-[400px]">
            {isLoading || isFetching ? (
              <div className="text-sm text-muted-foreground">Loading test script...</div>
            ) : isError ? (
              <div className="text-sm text-red-500">Failed to load test script.</div>
            ) : (
              <pre className="whitespace-pre-wrap wrap-break-word text-sm font-mono leading-relaxed">
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
            disabled={isFetching}
            className="text-red-600 hover:text-red-700 cursor-pointer"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Regenerate Test Script
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

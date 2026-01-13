import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'
import type { Page } from '@/utils/apis/siteApi'

type Props = {
  status: Page['status']
  onPlay: () => void
  onPause?: () => void
}

export function AnalyzeButton({ status, onPlay, onPause }: Props) {
  const isProcessing = status === 'Processing'

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      disabled={status === 'Done'}
      onClick={(e) => {
        e.stopPropagation()
        if (isProcessing) {
          onPause?.()
        } else {
          onPlay()
        }
      }}
    >
      {isProcessing ? (
        <Pause className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Play className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  )
}

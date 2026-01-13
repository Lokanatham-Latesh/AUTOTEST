import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

type Props = {
  status: 'Idle' | 'Running' | 'Done'
  onExecute: () => void
}

export function ExecuteButton({ status, onExecute }: Props) {
  if (status === 'Running') {
    return (
      <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-destructive" />
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      disabled={status === 'Done'}
      onClick={(e) => {
        e.stopPropagation()
        onExecute()
      }}
    >
      <Play className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}

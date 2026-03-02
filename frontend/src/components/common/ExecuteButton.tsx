import { Loader2, Play } from 'lucide-react'

type ExecuteButtonProps = {
  scenarioId: number
  isRunning: boolean
  onPlay: () => void
}

export function ExecuteButton({ isRunning, onPlay }: ExecuteButtonProps) {
  return (
    <button
      onClick={onPlay}
      disabled={isRunning}
      className="flex items-center justify-center mx-auto"
    >
      {isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Play className="h-4 w-4 text-primary cursor-pointer" />
      )}
    </button>
  )
}

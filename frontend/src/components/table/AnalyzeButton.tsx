import { PageStatus } from '@/types/pageInfo'
import { Loader2, Play } from 'lucide-react'

type AnalyzeButtonProps = {
  status: string
  onPlay?: () => void
  onPause?: () => void
}

export function AnalyzeButton({ status, onPlay }: AnalyzeButtonProps) {
  const isRunnable = status === PageStatus.NEW || status === PageStatus.DONE

  if (!isRunnable) {
    return <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
  }

  return (
    <button
      onClick={onPlay}
      className="mx-auto flex items-center justify-center text-primary hover:scale-110 transition cursor-pointer"
    >
      <Play size={18} />
    </button>
  )
}

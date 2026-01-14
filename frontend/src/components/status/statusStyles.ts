import type { AnalyzeStatus } from '@/types'

export const STATUS_BADGE_STYLES: Record<AnalyzeStatus, string> = {
  New: 'text-black text-xl ',
  Processing: 'text-black text-xl ',
  Done: 'text-black text-xl',
  Pause: 'text-black text-xl',
}

export const STATUS_DOT_STYLES = {
  done: 'bg-emerald-500',
  paused: 'bg-gray-300',
  idle: 'bg-[#E5D6D6]',

  processingActive: 'bg-[#FC0101]',
  processingInactive: 'bg-[#CED4D9]',
}

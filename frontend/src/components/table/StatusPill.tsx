import { cn } from '@/lib/utils'
import type { Page } from '@/utils/apis/siteApi'

export function StatusPill({ status }: { status: Page['status'] }) {
  const styles: Record<Page['status'], string> = {
    New: 'bg-blue-100 text-blue-700',
    Processing: 'bg-amber-100 text-amber-700',
    Done: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <span
      className={cn('inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium', styles[status])}
    >
      {status}
    </span>
  )
}

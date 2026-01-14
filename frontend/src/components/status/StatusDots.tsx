import type { AnalyzeStatus } from '@/types'
import { STATUS_DOT_STYLES } from './statusStyles'
import { useEffect, useState } from 'react'

const TOTAL_DOTS = 12
const INTERVAL_MS = 180

const StatusDots: React.FC<{ status: AnalyzeStatus }> = ({ status }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (status !== 'Processing') return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TOTAL_DOTS)
    }, INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status])

  // DONE → all green
  if (status === 'Done') {
    return (
      <div className="flex space-x-1.5">
        {[...Array(TOTAL_DOTS)].map((_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES.done}`} />
        ))}
      </div>
    )
  }

  // PAUSE → all gray
  if (status === 'Pause') {
    return (
      <div className="flex space-x-1.5">
        {[...Array(TOTAL_DOTS)].map((_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES.paused}`} />
        ))}
      </div>
    )
  }

  // PROCESSING → 3 moving dots
  if (status === 'Processing') {
    return (
      <div className="flex space-x-1.5">
        {[...Array(TOTAL_DOTS)].map((_, i) => {
          const isActive =
            i === activeIndex ||
            i === (activeIndex + 1) % TOTAL_DOTS ||
            i === (activeIndex + 2) % TOTAL_DOTS

          return (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                isActive ? STATUS_DOT_STYLES.processingActive : STATUS_DOT_STYLES.processingInactive
              }`}
            />
          )
        })}
      </div>
    )
  }

  // NEW → idle
  return (
    <div className="flex space-x-1.5">
      {[...Array(TOTAL_DOTS)].map((_, i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES.idle}`} />
      ))}
    </div>
  )
}

export default StatusDots

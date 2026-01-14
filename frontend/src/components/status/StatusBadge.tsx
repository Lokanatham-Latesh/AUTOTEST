import type { AnalyzeStatus } from '@/types'
import { STATUS_BADGE_STYLES } from './statusStyles'

const StatusBadge: React.FC<{ status: AnalyzeStatus }> = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
      STATUS_BADGE_STYLES[status]
    }`}
  >
    {status}
  </span>
)

export default StatusBadge

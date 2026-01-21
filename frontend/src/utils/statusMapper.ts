import type { PageStatus } from '@/types/pageInfo'
import type { AnalyzeStatus } from '@/types'

export const mapPageStatusToAnalyzeStatus = (status: PageStatus): AnalyzeStatus => {
  switch (status) {
    case 'new':
      return 'New'

    case 'generating_metadata':
    case 'generating_test_scenarios':
    case 'generating_test_cases':
    case 'generating_test_scripts':
      return 'Processing'

    case 'test_cases_generated':
    case 'done':
      return 'Done'

    default:
      return 'New'
  }
}

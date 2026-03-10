import { useQuery } from '@tanstack/react-query'
import { testExecutionApi } from '../apis/testExecutionApi'

export const useTestExecutions = (testCaseId: number | null) => {
  return useQuery({
    queryKey: ['test-executions', testCaseId],
    queryFn: () => testExecutionApi.getTestExecutionsByTestCase(testCaseId!),
    enabled: !!testCaseId,
  })
}

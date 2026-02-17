import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testCaseApi } from '../apis/testCaseApi'
import type { UpdateTestCasePayload } from '@/types/testCase'

export const useTestCaseDetails = (testCaseId: number) => {
  return useQuery({
    queryKey: ['test-case-details', testCaseId],
    queryFn: () => testCaseApi.getTestCase(testCaseId),
    enabled: !!testCaseId,
  })
}

export const useUpdateTestCaseMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ testCaseId, payload }: { testCaseId: number; payload: UpdateTestCasePayload }) =>
      testCaseApi.updateTestCase(testCaseId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['test-case-details', variables.testCaseId],
      })
    },
  })
}


export const useDeleteTestCaseMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (testCaseId: number) => testCaseApi.deleteTestCase(testCaseId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scenario-details'],
      })
    },
  })
}

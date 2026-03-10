import api from '../axios'
import type { TestExecutionResponse } from '@/types/testExecution'

export const testExecutionApi = {
  getTestExecutionsByTestCase: async (testCaseId: number): Promise<TestExecutionResponse> => {
    const { data } = await api.get(`/test-executions/test-case/${testCaseId}`)
    return data
  },
}

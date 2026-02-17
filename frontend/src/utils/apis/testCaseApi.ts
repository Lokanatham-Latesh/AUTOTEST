import api from '../axios'
import type { TestCaseDetailResponse, UpdateTestCasePayload } from '@/types/testCase'

export const testCaseApi = {
  getTestCase: async (testCaseId: number): Promise<TestCaseDetailResponse> => {
    const { data } = await api.get(`/test-cases/${testCaseId}`)
    return data
  },

  updateTestCase: async (
    testCaseId: number,
    payload: UpdateTestCasePayload,
  ): Promise<TestCaseDetailResponse> => {
    const { data } = await api.patch(`/test-cases/${testCaseId}`, payload)
    return data
  },
  deleteTestCase: async (testCaseId: number): Promise<void> => {
    await api.delete(`/test-cases/${testCaseId}`)
  },
}

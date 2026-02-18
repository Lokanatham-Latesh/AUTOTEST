import api from '../axios'
import type { CreateTestCasePayload, TestCaseDetailResponse, UpdateTestCasePayload } from '@/types/testCase'

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
  createTestCase: async (payload: CreateTestCasePayload): Promise<TestCaseDetailResponse> => {
    const { data } = await api.post(`/test-cases`, payload)
    return data
  },
}

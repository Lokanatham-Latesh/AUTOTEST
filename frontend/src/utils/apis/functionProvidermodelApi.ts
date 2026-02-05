import type { GetFunctionProviderModelResponse, GetFunctionResponse, GetProviderModelsMinimalResponse, UpsertFunctionProviderModelRequest } from '@/types/functionProvidermodel'
import api from '../axios'

export const functionApi = {
  getAllFunctions: async (): Promise<GetFunctionResponse> => {
    const { data } = await api.get('/functions/all')
    return { data }
  },
  getProviderModelsByProviderId: async (
    providerId: number,
  ): Promise<GetProviderModelsMinimalResponse> => {
    const { data } = await api.get(`/providers/${providerId}/models`)
    return { data }
  },
  getFunctionProviderModelByIds: async (
    functionId: number,
    providerId: number,
    modelId: number,
  ): Promise<GetFunctionProviderModelResponse> => {
    const { data } = await api.get(`/functions/${functionId}/${providerId}/${modelId}`)
    return { data }
  },
  upsertFunctionProviderModelPrompt: async (
    payload: UpsertFunctionProviderModelRequest,
  ): Promise<GetFunctionProviderModelResponse> => {
    const { data } = await api.put('/functions/function-provider-model', payload)
    return { data }
  },
}

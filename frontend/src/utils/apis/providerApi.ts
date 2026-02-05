import type { GetActiveProvidersResponse, GetProviderModelsResponse, GetProvidersResponse, Provider, ProviderBulkUpdatePayload, ProviderModelUpdateRequest, ProviderModelUpdateResponse } from '@/types/provider'
import api from '../axios'

export const providerApi = {
  getProviders: async (): Promise<GetProvidersResponse> => {
    const { data } = await api.get('/providers')
    return { data }
  },
  getActiveProviders: async (): Promise<GetActiveProvidersResponse> => {
    const { data } = await api.get('/providers/active')
    return { data }
  },
  bulkUpdateProviders: async (
    payload: ProviderBulkUpdatePayload[],
  ): Promise<{ data: Provider[] }> => {
    const { data } = await api.put('/providers/bulk-update', payload)
    return { data }
  },
  getProviderModels: async (providerId: number): Promise<GetProviderModelsResponse> => {
    const { data } = await api.get(`/providerModel/providers/${providerId}/models`)
    return data
  },
  bulkUpdateProviderModels: async (
    providerId: number,
    payload: ProviderModelUpdateRequest[],
  ): Promise<ProviderModelUpdateResponse[]> => {
    const { data } = await api.put(
      `/providerModel/providers/${providerId}/provider-models`,
      payload,
    )
    return data
  },
}

import type { GetProvidersResponse, Provider, ProviderBulkUpdatePayload } from '@/types/provider'
import api from '../axios'

export const providerApi = {
  getProviders: async (): Promise<GetProvidersResponse> => {
    const { data } = await api.get('/providers')
    return { data }
  },
  bulkUpdateProviders: async (
    payload: ProviderBulkUpdatePayload[],
  ): Promise<{ data: Provider[] }> => {
    const { data } = await api.put('/providers/bulk-update', payload)
    return { data }
  },
}

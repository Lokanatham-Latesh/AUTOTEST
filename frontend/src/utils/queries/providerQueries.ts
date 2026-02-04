// utils/queries/providerQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providerApi } from '../apis/providerApi'
import type { Provider, ProviderBulkUpdatePayload } from '@/types/provider'

export const useProvidersQuery = () =>
  useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await providerApi.getProviders()
      return res.data
    },
  })

export const useBulkUpdateProvidersMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProviderBulkUpdatePayload[]) => providerApi.bulkUpdateProviders(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}

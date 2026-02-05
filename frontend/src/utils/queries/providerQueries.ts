import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providerApi } from '../apis/providerApi'
import type {
  ActiveProvider,
  GetProviderModelsResponse,
  Provider,
  ProviderBulkUpdatePayload,
  ProviderModelUpdateRequest,
} from '@/types/provider'

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

export const useProviderModelsQuery = (providerId: number) =>
  useQuery<GetProviderModelsResponse>({
    queryKey: ['provider-models', providerId],
    queryFn: () => providerApi.getProviderModels(providerId),
    enabled: !!providerId,
  })

export const useBulkUpdateProviderModelsMutation = (providerId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProviderModelUpdateRequest[]) =>
      providerApi.bulkUpdateProviderModels(providerId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['provider-models', providerId],
      })
    },
  })
}
export const useActiveProvidersQuery = () =>
  useQuery<ActiveProvider[]>({
    queryKey: ['active-providers'],
    queryFn: async () => {
      const res = await providerApi.getActiveProviders()
      return res.data
    },
  })

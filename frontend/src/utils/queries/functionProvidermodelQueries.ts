import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Function, FunctionProviderModelResponse, ProviderModelMinimal, UpsertFunctionProviderModelRequest } from '@/types/functionProvidermodel'
import { functionApi } from '../apis/functionProvidermodelApi'

export const useFunctionsQuery = () =>
  useQuery<Function[]>({
    queryKey: ['functions'],
    queryFn: async () => {
      const res = await functionApi.getAllFunctions()
      return res.data
    },
  })
export const useProviderModelsByProviderIdQuery = (providerId?: number) =>
  useQuery<ProviderModelMinimal[]>({
    queryKey: ['provider-models-minimal', providerId],
    queryFn: async () => {
      const res = await functionApi.getProviderModelsByProviderId(providerId!)
      return res.data
    },
    enabled: !!providerId, 
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })


export const useFunctionProviderModelByIdsQuery = (
  functionId?: number,
  providerId?: number,
  modelId?: number,
) =>
  useQuery<FunctionProviderModelResponse>({
    queryKey: [
      'function-provider-model',
      functionId,
      providerId,
      modelId,
    ],
    queryFn: async () => {
      const res = await functionApi.getFunctionProviderModelByIds(
        functionId!,
        providerId!,
        modelId!,
      )
      return res.data
    },
    enabled: !!functionId && !!providerId && !!modelId, 
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  /* -------------------------------
   Upsert function-provider-model prompt
-------------------------------- */
export const useUpsertFunctionProviderModelMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertFunctionProviderModelRequest) =>
      functionApi.upsertFunctionProviderModelPrompt(payload),

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: [
          'function-provider-model',
          payload.function_id,
          payload.provider_id,
          payload.provider_model_id,
        ],
      })
    },
  })
}


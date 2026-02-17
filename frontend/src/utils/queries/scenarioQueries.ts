import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { GetScenariosParams, UpdateScenarioPayload } from '@/types/scenario'
import { scenarioApi } from '../apis/scenarioApi'

export const useScenariosQuery = ({
  page,
  limit,
  site_id,
  page_id,
  search,
  sort,
}: GetScenariosParams) => {
  return useQuery({
    queryKey: ['scenarios', page, limit, site_id, page_id, search, sort],
    queryFn: () =>
      scenarioApi.getScenarios({
        page,
        limit,
        site_id,
        page_id,
        search,
        sort,
      }),
    enabled: !!site_id || !!page_id,
  })
}

export const useScenarioDetails = (scenarioId: number) => {
  return useQuery({
    queryKey: ['scenario-details', scenarioId],
    queryFn: () => scenarioApi.getScenarioDetails(scenarioId),
    enabled: !!scenarioId,
  })
}

export const useDeleteScenarioMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scenarioId: number) => scenarioApi.deleteScenario(scenarioId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })
}


export const useUpdateScenarioMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scenarioId, payload }: { scenarioId: number; payload: UpdateScenarioPayload }) =>
      scenarioApi.updateScenario(scenarioId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
      queryClient.invalidateQueries({
        queryKey: ['scenario-details', variables.scenarioId],
      })
    },
  })
}


import { useQuery } from '@tanstack/react-query'
import type { GetScenariosParams } from '@/types/scenario'
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
    queryKey: ['scenarios', page, limit, site_id, page_id, search,sort ],
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

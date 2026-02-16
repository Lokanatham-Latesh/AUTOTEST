import type { GetScenariosParams, GetScenariosResponse, ScenarioDetailResponse } from '@/types/scenario'
import api from '../axios'

export const scenarioApi = {
  getScenarios: async (params: GetScenariosParams): Promise<GetScenariosResponse> => {
    const { data } = await api.get('/scenarios', { params })

    return {
      data: data.data,
      meta: {
        page: data.page,
        limit: data.limit,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / data.limit),
      },
    }
  },
    getScenarioDetails: async (
    scenarioId: number
  ): Promise<ScenarioDetailResponse> => {
    const { data } = await api.get(`/scenarios/${scenarioId}`)

    return data
  },
}



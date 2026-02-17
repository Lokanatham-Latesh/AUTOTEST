import type { GetScenariosParams, GetScenariosResponse, ScenarioDetailResponse, ScenarioUpdateResponse, UpdateScenarioPayload } from '@/types/scenario'
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
  getScenarioDetails: async (scenarioId: number): Promise<ScenarioDetailResponse> => {
    const { data } = await api.get(`/scenarios/${scenarioId}`)

    return data
  },
  updateScenario: async (
    scenarioId: number,
    payload: UpdateScenarioPayload,
  ): Promise<ScenarioUpdateResponse> => {
    const { data } = await api.patch(`/scenarios/${scenarioId}`, payload)
    return data
  },

  deleteScenario: async (scenarioId: number): Promise<void> => {
    await api.delete(`/scenarios/${scenarioId}`)
  },
}



export type Scenario = {
  id: number
  title: string
  type: string
  category: string | null
  test_case_count: number
}

export interface GetScenariosParams {
  page: number
  limit: number
  site_id?: number
  page_id?: number
  search?: string
  sort?: string
}

export interface GetScenariosResponse {
  data: Scenario[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export interface TestCaseDetail {
  id: number
  title: string
  type: string
  is_valid: boolean
  is_valid_default: boolean
}

export interface ScenarioDetailResponse {
  id: number
  title: string
  type: string
  category: string | null
  created_on: string
  data: Record<string, any> | null
  test_cases: TestCaseDetail[]
}

export interface UpdateScenarioPayload {
  title?: string
  category?: string
  type?: string
  data?: Record<string, any>
}
export interface ScenarioUpdateResponse {
  id: number
  title: string
  type: string
  category: string | null
  data: Record<string, any> | null
  updated_on: string
  updated_by: number
}


export type TestCaseStatus = 'Idle' | 'Running' | 'Done'

export type TestStep = {
  value: string
}

export type TestCase = {
  id: string
  title: string
  type: 'auto' | 'manual' // match form values
  category: 'functional' | 'regression' | 'smoke' | 'performance' // include all possible
  testCasesCount: number
  status: TestCaseStatus
  description?: string
  steps?: TestStep[]
}

export type TestScenarioForm = {
  title: string
  type: 'auto' | 'manual'
  category: 'functional' | 'regression' | 'smoke' | 'performance'
  description?: string
  steps: TestStep[]
}


export interface TestCaseDetailResponse {
  id: number
  title: string
  type: 'auto-generated' | 'manual'
  data?: Record<string, any> | null
  expected_outcome?: Record<string, any> | null
  validation?: Record<string, any> | null
  is_valid: boolean
  is_valid_default: boolean
  created_on?: string
  updated_on?: string
}

export interface UpdateTestCasePayload {
  title?: string
  type?: 'auto-generated' | 'manual'
  data?: Record<string, any>
  expected_outcome?: Record<string, any>
  validation?: Record<string, any>
  is_valid?: boolean
  is_valid_default?: boolean
}


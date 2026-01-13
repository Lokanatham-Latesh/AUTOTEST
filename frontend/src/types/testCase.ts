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

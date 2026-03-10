export interface TestExecution {
  id: number
  status: string | null
  logs: string | null
  executed_on: string | null
}

export type TestExecutionResponse = TestExecution[]

export const PageStatus = {
  NEW: 'new',
  GENERATING_METADATA: 'generating_metadata',
  GENERATING_TEST_SCENARIOS: 'generating_test_scenarios',
  GENERATING_TEST_CASES: 'generating_test_cases',
  TEST_CASES_GENERATED: 'test_cases_generated',
  GENERATING_TEST_SCRIPTS: 'generating_test_scripts',
  DONE: 'done',
} as const

export type PageStatus = (typeof PageStatus)[keyof typeof PageStatus]

export interface PageInfoResponse {
  page_id: number
  page_title: string
  page_url: string
  status: PageStatus
  created_on: string
  updated_on: string
  test_scenario_count: number
  test_case_count: number
  scheduled_test_case_count: number
}

export interface GetPageInfoParams {
  page_id: number
  site_id?: number
}

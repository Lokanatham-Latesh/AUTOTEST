

export type WSMessage =
  | { type: 'PING'; payload: {}; timestamp?: number }
  | { type: 'PONG'; payload: {}; timestamp?: number }
  | { type: 'AUTH'; payload: AuthPayload; timestamp?: number }
  | { type: 'ERROR'; payload: ErrorPayload; timestamp?: number }
  | { type: 'EVENT'; payload: EventPayload; timestamp?: number }
  | {
      type: 'PAGE_STATUS_UPDATE'
      payload: {
        updated_on: any
        page_url: any
        page_title: any
        page_id: number
        status: string
        test_scenario_count: number
        test_case_count: number
        scenario_id? : number
      }
      timestamp?: number
    }
  | {
      type: 'SITE_STATUS_UPDATE'
      payload: {
        site_id: number
        site_status: string | null
        page_count: number
        test_scenario_count: number
        test_case_count: number
      }
      timestamp?: number
    }

/* --------------------------
   Payload Types
-------------------------- */

export interface AuthPayload {
  token: string
}

export interface EventPayload {
  event: string
  data: unknown
}

export interface ErrorPayload {
  message: string
  code?: number
}

export interface GetSiteByIdResponse {
  id: number
  site_title: string
  site_url: string
  status: 'New' | 'Processing' | 'Done' | 'Pause'
  created_on: string
}

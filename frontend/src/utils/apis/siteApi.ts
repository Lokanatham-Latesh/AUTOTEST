// import sites from '@/mock/sites.json'
import type { GetSiteByIdResponse } from '@/types/site'
import api from '../axios'

export type Site = {
  created_on: string
  id: string
  site_title: string
  site_url: string
  status: 'New' | 'Processing' | 'Done' | 'Pause'
}
export type SiteInfo = {
  site_id: number
  site_title: string
  site_url: string
  status: 'New' | 'Processing' | 'Done' | 'Pause'
  created_on: string
  updated_on: string
  page_count: number
  test_scenario_count: number
  test_case_count: number
  test_suite_count: number
  test_environment: string | null
  scheduled_test_cases: string | null
}

export interface GetSitesParams {
  page: number
  limit: number
  search?: string
  sort?: string
}

export interface GetSitePagesParams {
  siteId: number
  page: number
  limit: number
  search?: string
  sort?: string
}

export interface GetSitesResponse {
  data: Site[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export interface CreateSitePayload {
  site_title: string
  site_url: string
}
export type Page = {
  id: number
  site_id: number
  page_url: string
  page_title?: string
  status: string
  created_on: string
}

export interface GetSitePagesResponse {
  data: Page[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

export const siteApi = {
  getSites: async (params: GetSitesParams): Promise<GetSitesResponse> => {
    const { data } = await api.get('/sites', { params })

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
  createSite: async (payload: CreateSitePayload) => {
    const { data } = await api.post('/sites', payload)
    return data
  },
  getPagesBySite: async (params: GetSitePagesParams): Promise<GetSitePagesResponse> => {
    const { siteId, ...queryParams } = params

    const { data } = await api.get(`/sites/${siteId}/pages`, { params: queryParams })

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
  getSiteInfo: async (siteId: number): Promise<SiteInfo> => {
    const { data } = await api.get(`/sites/${siteId}/info`)
    return data
  },
  deleteSite: async (siteId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}`)
  },
  getSiteById: async (siteId: number): Promise<GetSiteByIdResponse> => {
    const { data } = await api.get(`/sites/${siteId}`)
    return data
  },
}

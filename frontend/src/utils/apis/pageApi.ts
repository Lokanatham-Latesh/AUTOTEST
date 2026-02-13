import type { CreatePagePayload, GetPageInfoParams, PageInfoResponse, UpdatePageTitlePayload } from '@/types/pageInfo'
import api from '../axios'

export type Page = {
  id: number
  site_id: number | null
  page_url: string
  page_title?: string
  status: string
  created_on: string
}

export interface GetUnlinkedPagesParams {
  page: number
  limit: number
  search?: string
  sort?: 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc'
}

export interface GetUnlinkedPagesResponse {
  data: Page[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}

/* ------------------ API ------------------ */

export const pageApi = {
  getUnlinkedPages: async (params: GetUnlinkedPagesParams): Promise<GetUnlinkedPagesResponse> => {
    const { data } = await api.get('/pages/unlinked', { params })

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
  getPageInfo: async (params: GetPageInfoParams): Promise<PageInfoResponse> => {
    const { data } = await api.get('/pages/info', { params })
    return data
  },
  deletePage: async (pageId: number): Promise<void> => {
    await api.delete(`/pages/${pageId}`)
  },
  createPage: async (payload: CreatePagePayload): Promise<Page> => {
    const { data } = await api.post('/pages', payload)
    return data
  },
  updatePageTitle: async (pageId: number, payload: UpdatePageTitlePayload): Promise<Page> => {
    const { data } = await api.patch(`/pages/${pageId}/title`, payload)
    return data
  },
}
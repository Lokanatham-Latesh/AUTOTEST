import type { CreateSiteAttributePayload, SiteAttributeResponse } from '@/types/siteAttribute'
import api from '../axios'

export const siteAttributeApi = {
  /**
   * Create site attributes (bulk)
   */
  createSiteAttributes: async (
    payload: CreateSiteAttributePayload,
  ): Promise<SiteAttributeResponse> => {
    const { data } = await api.post('/site-attributes', payload)
    return data
  },

  /**
   * Delete site attribute
   */
  deleteSiteAttribute: async (attributeId: number): Promise<void> => {
    await api.delete(`/site-attributes/${attributeId}`)
  },
  /**
   * Get attributes by site_id
   */
  getSiteAttributes: async (siteId: number): Promise<SiteAttributeResponse> => {
    const { data } = await api.get(`/site-attributes/site/${siteId}`)
    return data
  },
}



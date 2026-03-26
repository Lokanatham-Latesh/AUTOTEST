import { useMutation, useQuery } from '@tanstack/react-query'
import { siteAttributeApi } from '../apis/siteAttributeApi'
import type { CreateSiteAttributePayload, UpdateSiteAttributePayload } from '@/types/siteAttribute'

export const useCreateSiteAttributes = () => {
  return useMutation({
    mutationFn: (payload: CreateSiteAttributePayload) =>
      siteAttributeApi.createSiteAttributes(payload),
  })
}
export const useDeleteSiteAttribute = () => {
  return useMutation({
    mutationFn: (id: number) => siteAttributeApi.deleteSiteAttribute(id),
  })
}

export const useGetSiteAttributes = (siteId: number | null) => {
  return useQuery({
    queryKey: ['site-attributes', siteId],
    queryFn: () => siteAttributeApi.getSiteAttributes(siteId!),
    enabled: !!siteId,
  })
}
export const useUpdateSiteAttribute = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSiteAttributePayload }) =>
      siteAttributeApi.updateSiteAttribute(id, payload),
  })
}
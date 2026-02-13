import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pageApi } from '../apis/pageApi'
import type { SortType } from '@/types'
import type { CreatePagePayload, GetPageInfoParams, PageInfoResponse, UpdatePageTitlePayload } from '@/types/pageInfo'
export const useUnlinkedPagesQuery = ({
  page,
  limit,
  search,
  sort,
}: {
  page: number
  limit: number
  search?: string
  sort?: SortType
}) => {
  return useQuery({
    queryKey: ['unlinked-pages', page, limit, search, sort],
    queryFn: () =>
      pageApi.getUnlinkedPages({
        page,
        limit,
        search,
        sort,
      }),
  })
}

export const usePageInfoQuery = (params: GetPageInfoParams) => {
  const { page_id, site_id } = params

  return useQuery<PageInfoResponse>({
    queryKey: ['page-info', page_id, site_id],
    queryFn: () => pageApi.getPageInfo(params),
    enabled: Boolean(page_id),
  })
}

export const useDeletePageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pageId: number) => pageApi.deletePage(pageId),

    onSuccess: (_, pageId) => {

      queryClient.invalidateQueries({ queryKey: ['unlinked-pages'] })
      queryClient.invalidateQueries({ queryKey: ['site-pages'] })
      queryClient.invalidateQueries({ queryKey: ['page-info', pageId] })
    },
  })
}

export const useCreatePageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePagePayload) => pageApi.createPage(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlinked-pages'] })
    },
  })
}

export const useUpdatePageTitleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pageId, payload }: { pageId: number; payload: UpdatePageTitlePayload }) =>
      pageApi.updatePageTitle(pageId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['page-info', variables.pageId],
      })

      queryClient.invalidateQueries({ queryKey: ['unlinked-pages'] })
      queryClient.invalidateQueries({ queryKey: ['site-pages'] })
    },
  })
}

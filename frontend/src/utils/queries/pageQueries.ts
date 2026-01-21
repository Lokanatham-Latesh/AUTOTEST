import { useQuery } from '@tanstack/react-query'
import { pageApi } from '../apis/pageApi'
import type { SortType } from '@/types'
import type { GetPageInfoParams, PageInfoResponse } from '@/types/pageInfo'

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

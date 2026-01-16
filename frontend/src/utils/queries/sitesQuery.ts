import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { siteApi } from '../apis/siteApi'
import type { CreateSitePayload } from '../apis/siteApi'
import type { SortType } from '@/types'

export const useSitesQuery = ({
  page,
  limit,
  search,
  sort,
}: {
  page: number
  limit: number
  search: string
  sort?: SortType
}) => {
  return useQuery({
    queryKey: ['sites', page, limit, search, sort],
    queryFn: () =>
      siteApi.getSites({
        page,
        limit,
        search,
        sort,
      }),
  })
}

export type SiteInfo = {
  id: string
  title: string
  url: string
  createdAt: string
  updatedAt: string
  stats: {
    pages: number
    testScenario: number
    testCases: number
    testSuite: number
    testEnvironment: number
    scheduleTestCase: number
  }
  analyzeStatus: 'New' | 'Processing' | 'Done' |'Pause'
}

export const useSiteInfoQuery = (id: string) => {
  return useQuery<SiteInfo>({
    queryKey: ['site-info', id],

    queryFn: async () => {
      const apiData = await siteApi.getSiteInfo(Number(id))

      return {
        id: String(apiData.site_id),
        title: apiData.site_title,
        url: apiData.site_url,
        createdAt: apiData.created_on,
        updatedAt: apiData.updated_on,
        analyzeStatus: apiData.status,
        stats: {
          pages: apiData.page_count,
          testScenario: apiData.test_scenario_count,
          testCases: apiData.test_case_count,
          testSuite: apiData.test_suite_count,
          testEnvironment: apiData.test_environment ? Number(apiData.test_environment) : 0,
          scheduleTestCase: apiData.scheduled_test_cases ? Number(apiData.scheduled_test_cases) : 0,
        },
      }
    },

    enabled: !!id,
  })
}


export const useCreateSiteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSitePayload) => siteApi.createSite(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })
}

export const useSitePagesQuery = ({
  siteId,
  page,
  limit,
  search,
  sort,
}: {
  siteId: number
  page: number
  limit: number
  search?: string
  sort?: SortType
}) => {
  return useQuery({
    queryKey: ['site-pages', siteId, page, limit, search, sort],

    queryFn: () =>
      siteApi.getPagesBySite({
        siteId,
        page,
        limit,
        search,
        sort,
      }),

    enabled: !!siteId,
  })
}

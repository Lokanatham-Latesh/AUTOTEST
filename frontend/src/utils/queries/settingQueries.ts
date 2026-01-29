import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi } from '../apis/settingApi'
import type {
  GetSettingCategoriesResponse,
  GetSettingsByCategoryResponse,
  UpdateSettingActualValueRequest,
  UpdateSettingActualValueResponse,
  BulkUpdateSettingsRequest,
  BulkUpdateSettingsResponse,
} from '@/types/setting'

/* ------------------ Categories ------------------ */
export const useSettingCategoriesQuery = () => {
  return useQuery<GetSettingCategoriesResponse>({
    queryKey: ['setting-categories'],
    queryFn: () => settingApi.getSettingCategories(),
  })
}

/* ------------------ Settings by Category ------------------ */
export const useSettingsByCategoryQuery = (categoryId: number) => {
  return useQuery<GetSettingsByCategoryResponse>({
    queryKey: ['settings-by-category', categoryId],
    queryFn: () => settingApi.getSettingsByCategory(categoryId),
    enabled: !!categoryId,
  })
}

/* ------------------ Single Setting Update ------------------ */
export const useUpdateSettingActualValueMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateSettingActualValueResponse,
    Error,
    { settingId: number; payload: UpdateSettingActualValueRequest }
  >({
    mutationFn: ({ settingId, payload }) => settingApi.updateSettingActualValue(settingId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['settings-by-category'],
      })
    },
  })
}

/* ------------------ Bulk Category-wise Update (BEST PRACTICE) ------------------ */
export const useBulkUpdateSettingsByCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<
    BulkUpdateSettingsResponse,
    Error,
    { categoryId: number; payload: BulkUpdateSettingsRequest }
  >({
    mutationFn: ({ categoryId, payload }) =>
      settingApi.updateSettingsByCategory(categoryId, payload),

    onSuccess: (_data, variables) => {
      // Refresh only this category
      queryClient.invalidateQueries({
        queryKey: ['settings-by-category', variables.categoryId],
      })
    },
  })
}

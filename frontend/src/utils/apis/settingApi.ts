import type {
  GetSettingCategoriesResponse,
  GetSettingsByCategoryResponse,
  UpdateSettingActualValueRequest,
  UpdateSettingActualValueResponse,
  BulkUpdateSettingsRequest,
  BulkUpdateSettingsResponse,
} from '@/types/setting'
import api from '../axios'

export const settingApi = {
  /* ---------------- Categories ---------------- */
  getSettingCategories: async (): Promise<GetSettingCategoriesResponse> => {
    const { data } = await api.get('/settings/categories')
    return { data }
  },

  /* ---------------- Settings by Category ---------------- */
  getSettingsByCategory: async (categoryId: number): Promise<GetSettingsByCategoryResponse> => {
    const { data } = await api.get(`/settings/category/${categoryId}`)
    return { data }
  },

  /* ---------------- Single Setting Update ---------------- */
  updateSettingActualValue: async (
    settingId: number,
    payload: UpdateSettingActualValueRequest,
  ): Promise<UpdateSettingActualValueResponse> => {
    const { data } = await api.patch(`/settings/${settingId}/actual-value`, payload)
    return { data }
  },

  /* ---------------- Bulk Category Update (BEST PRACTICE) ---------------- */
  updateSettingsByCategory: async (
    categoryId: number,
    payload: BulkUpdateSettingsRequest,
  ): Promise<BulkUpdateSettingsResponse> => {
    const { data } = await api.patch(`/settings/category/${categoryId}/actual-values`, payload)
    return { data }
  },
}

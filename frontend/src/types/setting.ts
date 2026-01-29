export interface SettingCategory {
  id: number
  title: string
}

export interface GetSettingCategoriesResponse {
  data: SettingCategory[]
}

export interface Setting {
  id: number
  key: string
  title: string
  description: string | null
  type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Radio Button' | 'Checkbox'
  possible_values: string | null
  default_value: string | null
  actual_value: string | null
  setting_category_id: number
  updated_on: string
  updated_by: number
}

export interface GetSettingsByCategoryResponse {
  data: Setting[]
}

export interface UpdateSettingActualValueRequest {
  actual_value: string | null
}

export interface UpdateSettingActualValueResponse {
  data: Setting
}
export interface BulkUpdateSettingItem {
  id: number
  actual_value: string | null
}

export interface BulkUpdateSettingsRequest {
  settings: BulkUpdateSettingItem[]
}

export interface BulkUpdateSettingsResponse {
  data: Setting[]
}

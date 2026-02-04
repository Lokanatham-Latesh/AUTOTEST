export interface Provider {
  id: number
  title: string
  key: string
  is_active: boolean
  created_on: string
}

export interface GetProvidersResponse {
  data: Provider[]
}

export interface ProviderBulkUpdatePayload {
  provider_id: number
  key: string |null
  is_active: boolean
}


export interface EditableProvider {
  provider_id: number
  title: string
  key: string 
  is_active: boolean
}

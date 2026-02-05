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

export interface ProviderModelConfig {
  id: number
  title: string
  model: string
  temperature: number
  prompt: string
}

export interface GetProviderModelsResponse {
  providerId: number
  providerTitle: string
  models: ProviderModelConfig[]
}

export interface ProviderModelUpdateRequest {
  id: number
  model: string
  temperature: number
  prompt: string
}

export interface ProviderModelUpdateResponse {
  id?: number
  provider_id?: number
  title?: string
  model?: string
  prompt?: string
  temperature?: number
  updated_by?: number
  updated_on?: string
}
export type ActiveProvider = {
  providerId: number
  providerTitle: string
}

export type GetActiveProvidersResponse = {
  data: ActiveProvider[]
}



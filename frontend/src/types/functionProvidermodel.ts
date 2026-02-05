export interface Function {
  id: number
  title: string
  prompt: string
  created_on: string
  updated_on: string
  created_by: string | null
  updated_by: string | null
}

export interface GetFunctionResponse {
  data: Function[]
}
export type ProviderModelMinimal = {
  providerModelId: number
  model: string
}

export type GetProviderModelsMinimalResponse = {
  data: ProviderModelMinimal[]
}

export type FunctionProviderModelResponse = {
  id: number
  function_id: number
  provider_id: number
  provider_model_id: number
  additional_info: string | null
  created_by: number | null
  created_on: string
  updated_by: number | null
  updated_on: string | null
}

export type GetFunctionProviderModelResponse = {
  data: FunctionProviderModelResponse
}

export type UpsertFunctionProviderModelRequest = {
  function_id: number
  provider_id: number
  provider_model_id: number
  additional_info: string
}




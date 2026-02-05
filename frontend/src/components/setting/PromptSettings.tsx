import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { PromptEditor } from '../common/PromptEditor'
import {
  useFunctionsQuery,
  useProviderModelsByProviderIdQuery,
  useFunctionProviderModelByIdsQuery,
  useUpsertFunctionProviderModelMutation,
} from '@/utils/queries/functionProvidermodelQueries'
import { useActiveProvidersQuery } from '@/utils/queries/providerQueries'

type AppliedFilters = {
  functionId?: number
  providerId?: number
  modelId?: number
}

export const PromptSettings = () => {

  const { data: functions = [] } = useFunctionsQuery()
  const { data: providers = [] } = useActiveProvidersQuery()


  const [functionKey, setFunctionKey] = useState<string>('')
  const [apiProvider, setApiProvider] = useState<string>('')
  const [modelProvider, setModelProvider] = useState<string>('')


  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({})


  const [prompt, setPrompt] = useState('')
  const [savedPrompt, setSavedPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)


  const providerId = apiProvider ? Number(apiProvider) : undefined
  const { data: providerModels = [] } =
    useProviderModelsByProviderIdQuery(providerId)


  const { data: mapping } = useFunctionProviderModelByIdsQuery(
    appliedFilters.functionId,
    appliedFilters.providerId,
    appliedFilters.modelId,
  )


  const { mutate: savePrompt, isPending: isSaving } =
    useUpsertFunctionProviderModelMutation()



  useEffect(() => {
    if (mapping?.additional_info !== undefined) {
      setPrompt(mapping.additional_info ?? '')
      setSavedPrompt(mapping.additional_info ?? '')
    } else if (mapping) {
      setPrompt('')
      setSavedPrompt('')
    }
  }, [mapping])

  useEffect(() => {
    setModelProvider('')
  }, [apiProvider])

  useEffect(() => {
    setPrompt('')
    setSavedPrompt('')
    setIsEditing(false)
  }, [appliedFilters])


  const handleApply = () => {
    if (!functionKey || !apiProvider || !modelProvider) return

    setAppliedFilters({
      functionId: Number(functionKey),
      providerId: Number(apiProvider),
      modelId: Number(modelProvider),
    })
  }

  const handleSave = () => {
    if (
      !appliedFilters.functionId ||
      !appliedFilters.providerId ||
      !appliedFilters.modelId
    )
      return

    savePrompt(
      {
        function_id: appliedFilters.functionId,
        provider_id: appliedFilters.providerId,
        provider_model_id: appliedFilters.modelId,
        additional_info: prompt,
      },
      {
        onSuccess: () => {
          setSavedPrompt(prompt)
          setIsEditing(false)
        },
      },
    )
  }

  const handleCancelEdit = () => {
    setPrompt(savedPrompt)
    setIsEditing(false)
  }

  const isApplyDisabled =
    !functionKey || !apiProvider || !modelProvider || isEditing


  return (
    <div className="w-full max-w-none space-y-6">
      {/* ================= FILTER BAR ================= */}
      <div className="w-full">
        <div className="px-2 py-1">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Function */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">Function</label>
                <Select value={functionKey} onValueChange={setFunctionKey}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    {functions.map((fn) => (
                      <SelectItem key={fn.id} value={fn.id.toString()}>
                        {fn.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* API Provider */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">API Provider</label>
                <Select value={apiProvider} onValueChange={setApiProvider}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem
                        key={provider.providerId}
                        value={provider.providerId.toString()}
                      >
                        {provider.providerTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Provider */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">Model Provider</label>
                <Select
                  value={modelProvider}
                  onValueChange={setModelProvider}
                  disabled={!apiProvider}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue
                      placeholder={
                        apiProvider ? 'Select model' : 'Select provider first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {apiProvider ? (
                      providerModels.length > 0 ? (
                        providerModels.map((model) => (
                          <SelectItem
                            key={model.providerModelId}
                            value={model.providerModelId.toString()}
                          >
                            {model.model}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No models available
                        </div>
                      )
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Please select a provider
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                size="sm"
                className="h-9 w-full lg:w-auto bg-red-500 hover:bg-red-600 px-6"
                onClick={handleApply}
                disabled={isApplyDisabled}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PROMPT ================= */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 border-b">
          <span className="font-medium">Prompt</span>

          {isEditing ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 px-4"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="px-4"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 px-4"
              onClick={() => setIsEditing(true)}
              disabled={!appliedFilters.modelId}
            >
              Edit
            </Button>
          )}
        </div>

        <div className="min-h-[300px] lg:h-[420px] overflow-y-auto p-4">
          {isEditing ? (
            <PromptEditor value={prompt} isEditing onChange={setPrompt} />
          ) : !prompt ? (
            <div className="text-sm text-muted-foreground italic">
              No prompt is configured for the selected Function, Provider, and
              Model.
              <br />
              Click <b>Edit</b> to add a new prompt.
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: prompt }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

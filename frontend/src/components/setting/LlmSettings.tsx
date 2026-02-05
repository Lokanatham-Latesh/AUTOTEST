import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useProvidersQuery } from '@/utils/queries/providerQueries'
import { useBulkUpdateProvidersMutation, useProviderModelsQuery, useBulkUpdateProviderModelsMutation } from '@/utils/queries/providerQueries'
import { CollapsibleSection } from './CollapsibleSection'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EditableProvider {
  provider_id: number
  title: string
  key: string
  is_active: boolean
}

export const LlmSettings = () => {

  const { data: providers, isLoading } = useProvidersQuery()
  const { mutate: bulkUpdateProviders, isPaused: isSaving } = useBulkUpdateProvidersMutation()
  const [editableProviders, setEditableProviders] = useState<EditableProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [editableModels, setEditableModels] = useState<any[]>([])
  const [originalModels, setOriginalModels] = useState<any[]>([])
  const [originalProviders, setOriginalProviders] = useState<EditableProvider[]>([])


  useEffect(() => {
    if (providers?.length && !selectedProviderId) {
      setSelectedProviderId(providers[0].id)
    }
  }, [providers, selectedProviderId])

  const { data: providerModels, isLoading: isModelsLoading } = useProviderModelsQuery(
    selectedProviderId ?? 0,
  )

  useEffect(() => {
    if (providers) {
      const mappedProviders = providers.map((p) => ({
        provider_id: p.id,
        title: p.title,
        key: p.key ?? '',
        is_active: p.is_active,
      }))

      setEditableProviders(mappedProviders)
      setOriginalProviders(mappedProviders) 
    }
  }, [providers])


  useEffect(() => {
    if (providerModels?.models) {
      setEditableModels(providerModels.models)
      setOriginalModels(providerModels.models)
    }
  }, [providerModels])
  const handleModelChange = (modelId: number, field: 'temperature' | 'prompt', value: any) => {
    setEditableModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, [field]: value } : m)))
  }

  const getUpdatedModelsPayload = () => {
    return editableModels
      .filter((edited) => {
        const original = originalModels.find((o) => o.id === edited.id)
        if (!original) return false

        return original.temperature !== edited.temperature || original.prompt !== edited.prompt
      })
      .map((m) => ({
        id: m.id,
        model: m.model,
        temperature: m.temperature,
        prompt: m.prompt,
      }))
  }

  const { mutate: saveProviderModels, isPending: isSavingModels } =
    useBulkUpdateProviderModelsMutation(selectedProviderId!)

  const handleSaveModels = () => {
    const payload = getUpdatedModelsPayload()

    if (!payload.length) {
      toast.info('No changes to save')
      return
    }

    saveProviderModels(payload, {
      onSuccess: () => {
        toast.success('Model settings updated successfully')
         setOriginalModels(editableModels)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to update models')
      },
    })
  }

  const handleToggle = (providerId: number, checked: boolean) => {
    setEditableProviders((prev) =>
      prev.map((p) => (p.provider_id === providerId ? { ...p, is_active: checked } : p)),
    )
  }

  const handleKeyChange = (providerId: number, value: string) => {
    setEditableProviders((prev) =>
      prev.map((p) => (p.provider_id === providerId ? { ...p, key: value } : p)),
    )
  }
  const hasModelChanges = editableModels.some((edited) => {
    const original = originalModels.find((o) => o.id === edited.id)
    if (!original) return false

    return original.temperature !== edited.temperature || original.prompt !== edited.prompt
  })

  const hasProviderChanges = editableProviders.some((edited) => {
    const original = originalProviders.find((o) => o.provider_id === edited.provider_id)
    if (!original) return false

    return original.is_active !== edited.is_active || original.key !== edited.key
  })


  const handleSaveProviders = () => {
    const hasAtLeastOneActive = editableProviders.some((p) => p.is_active)

    if (!hasAtLeastOneActive) {
      toast.error('At least one provider must be enabled')
      return
    }

    const invalidProvider = editableProviders.find((p) => p.is_active && !p.key.trim())

    if (invalidProvider) {
      toast.error(`Key is required for ${invalidProvider.title}`)
      return
    }

    bulkUpdateProviders(editableProviders, {
      onSuccess: () => {
        toast.success('Providers updated successfully')
        setOriginalProviders(editableProviders)
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to update providers')
      },
    })
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection title="API Provider" onSave={handleSaveProviders} loading={isSaving}disabled={!hasProviderChanges}>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {editableProviders.map((provider) => (
              <div key={provider.provider_id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={provider.is_active}
                    onCheckedChange={(checked) =>
                      handleToggle(provider.provider_id, Boolean(checked))
                    }
                  />
                  <span className="font-medium">{provider.title}</span>
                </div>

                <Input
                  value={provider.key}
                  onChange={(e) => handleKeyChange(provider.provider_id, e.target.value)}
                  placeholder="Enter API key"
                  disabled={!provider.is_active}
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Model Provider" onSave={handleSaveModels} loading={isSavingModels} disabled ={!hasModelChanges}>
        <RadioGroup
          value={String(selectedProviderId)}
          onValueChange={(v) => setSelectedProviderId(Number(v))}
          className="flex gap-6 flex-wrap"
        >
          {providers?.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <RadioGroupItem value={String(p.id)} />
              <span className="font-medium">{p.title}</span>
            </div>
          ))}
        </RadioGroup>

        <TooltipProvider>
          <div className="space-y-6 pt-6">
            {isModelsLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              </div>
            ) : editableModels.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No models configured for this provider
              </div>
            ) : (
              editableModels.map((model) => (
                <div key={model.id} className="space-y-3">
                  <span className="font-medium">{model.title}</span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="md:col-span-2">
                          <Input value={model.model} readOnly placeholder="Model" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Model used for this function</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={model.temperature}
                            onChange={(e) =>
                              handleModelChange(model.id, 'temperature', Number(e.target.value))
                            }
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Controls randomness (0 = deterministic, 1 = creative)
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Textarea
                        value={model.prompt ?? ''}
                        rows={5}
                        className="resize-none"
                        placeholder="Prompt"
                        onChange={(e) => handleModelChange(model.id, 'prompt', e.target.value)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>Instruction prompt for this function</TooltipContent>
                  </Tooltip>
                </div>
              ))
            )}
          </div>
        </TooltipProvider>
      </CollapsibleSection>
    </div>
  )
}

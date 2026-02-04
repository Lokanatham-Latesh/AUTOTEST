import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useProvidersQuery } from '@/utils/queries/providerQueries'
import { useBulkUpdateProvidersMutation } from '@/utils/queries/providerQueries'
import { dummyLlmSettings, type ProviderId } from '@/utils/dummyData'
import { CollapsibleSection } from './CollapsibleSection'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


interface EditableProvider {
  provider_id: number
  title: string
  key: string
  is_active: boolean
}


export const LlmSettings = () => {
  /* -----------------------------
   * API Providers (Backend)
   * ----------------------------- */
  const { data: providers, isLoading } = useProvidersQuery()
  const { mutate: bulkUpdateProviders, isPaused: isSaving } = useBulkUpdateProvidersMutation()

  const [editableProviders, setEditableProviders] = useState<EditableProvider[]>([])

  /* -----------------------------
   * Model Providers (UI-only for now)
   * ----------------------------- */
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(
    dummyLlmSettings.modelProviders.selectedProvider,
  )

  const providerConfig = dummyLlmSettings.modelProviders.providerConfigs[selectedProvider]

  /* -----------------------------
   * Sync API → local editable state
   * ----------------------------- */
  useEffect(() => {
    if (providers) {
      setEditableProviders(
        providers.map((p) => ({
          provider_id: p.id,
          title: p.title,
          key: p.key ?? '',
          is_active: p.is_active,
        })),
      )
    }
  }, [providers])

  /* -----------------------------
   * Handlers – API Providers
   * ----------------------------- */
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

  const handleSaveProviders = () => {
    const invalidProvider = editableProviders.find((p) => p.is_active && !p.key.trim())

    if (invalidProvider) {
      toast.error(`Key is required for ${invalidProvider.title}`)
      return
    }

    bulkUpdateProviders(editableProviders, {
      onSuccess: () => {
        toast.success('Providers updated successfully')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Failed to update providers')
      },
    })
  }

  /* -----------------------------
   * Render
   * ----------------------------- */
  return (
    <div className="space-y-6">
      {/* ============================
          API PROVIDER SECTION
         ============================ */}
      <CollapsibleSection title="API Provider" onSave={handleSaveProviders} loading={isSaving}>
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

      <CollapsibleSection title="Model Provider">
        <RadioGroup
          value={selectedProvider}
          onValueChange={(v) => setSelectedProvider(v as ProviderId)}
          className="flex gap-6"
        >
          {dummyLlmSettings.modelProviders.providers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <RadioGroupItem value={p.id} />
              <span className="font-medium">{p.label}</span>
            </div>
          ))}
        </RadioGroup>

        <TooltipProvider>
          <div className="space-y-6 pt-4">
            {providerConfig.functions.map((fn) => (
              <div key={fn.key} className="space-y-3">
                {/* Function title */}
                <span className="font-medium">{fn.label}</span>

                {/* Model + Temperature */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Model */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="md:col-span-2">
                        <Input value={fn.model} readOnly placeholder="Model" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Model used for this function</TooltipContent>
                  </Tooltip>

                  {/* Temperature */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={fn.temperature}
                          placeholder="Temp"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Controls randomness (0 = deterministic, 1 = creative)
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Prompt */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Textarea
                      value={fn.prompt}
                      placeholder="Prompt"
                      rows={5}
                      className="resize-none"
                    />
                  </TooltipTrigger>
                  <TooltipContent>Instruction prompt for this function</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CollapsibleSection>
    </div>
  )
}

import { useState } from 'react'
import { dummyLlmSettings, type ProviderId } from '@/utils/dummyData'
import { CollapsibleSection } from './CollapsibleSection'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

export const LlmSettings = () => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(
    dummyLlmSettings.modelProviders.selectedProvider,
  )

  const providerConfig = dummyLlmSettings.modelProviders.providerConfigs[selectedProvider]

  return (
    <div className="space-y-6">
      <CollapsibleSection title="API Provider">
        <div className="grid grid-cols-2 gap-4">
          {dummyLlmSettings.apiProviders.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={provider.enabled} />
                <span className="font-medium">{provider.title}</span>
              </div>

              <Input value={provider.key} />
            </div>
          ))}
        </div>
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
              <span>{p.label}</span>
            </div>
          ))}
        </RadioGroup>

        <div className="space-y-4 pt-4">
          {providerConfig.functions.map((fn) => (
            <div key={fn.key} className="space-y-2">
              <label className="font-medium">{fn.label}</label>

              {fn.key === 'temperature' ? (
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={fn.model}
                  placeholder="Enter temperature"
                />
              ) : (
                <>
                  <div className="w-1/2">
                    <Input value={fn.model} readOnly />
                  </div>
                  <Textarea
                    value={fn.prompt}
                    placeholder="Enter prompt"
                    rows={6}
                    className="resize-none"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}

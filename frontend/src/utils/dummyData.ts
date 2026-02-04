
export type ProviderId = 'openai' | 'groq'

export interface FunctionConfig {
  key: string
  label: string
  model: string
  temperature: number
  prompt: string
}

export interface ProviderConfig {
  functions: FunctionConfig[]
}

export const dummyLlmSettings = {
  modelProviders: {
    selectedProvider: 'openai' as ProviderId,

    providers: [
      { id: 'openai', label: 'OpenAI' },
      { id: 'groq', label: 'Groq' },
    ],

    providerConfigs: {
      openai: {
        functions: [
          {
            key: 'analysis',
            label: 'Analysis Model',
            model: 'gpt-5-mini',
            temperature: 0.7,
            prompt: '',
          },
          {
            key: 'selection',
            label: 'Selection Model',
            model: 'gpt-5-mini-6',
            temperature: 0.7,
            prompt: '',
          },
          {
            key: 'result',
            label: 'Result Analysis Model',
            model: 'gpt-5-mini',
            temperature: 0.7,
            prompt: '',
          },
        ],
      },

      groq: {
        functions: [
          {
            key: 'analysis',
            label: 'Analysis Model',
            model: 'llama-3',
            temperature: 0.5,
            prompt: '',
          },
          {
            key: 'selection',
            label: 'Selection Model',
            model: 'mixtral',
            temperature: 0.5,
            prompt: '',
          },
          {
            key: 'result',
            label: 'Result Analysis Model',
            model: 'llama-3',
            temperature: 0.5,
            prompt: '',
          },
        ],
      },
    },
  },
}

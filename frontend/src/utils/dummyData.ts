export type ProviderId = 'openai' | 'groq' | 'google' | 'anthropic' | 'ollama'

export interface FunctionConfig {
  key: string
  label: string
  model: string
  prompt: string
}

export interface ProviderConfig {
  functions: FunctionConfig[]
}

export const dummyLlmSettings = {
  apiProviders: [
    {
      id: 'gemini',
      title: 'Gemini API Provider',
      enabled: true,
      key: 'Gemini-2.5-mini-2025-04-14',
    },
    {
      id: 'openai',
      title: 'Open AI Provider',
      enabled: false,
      key: 'Open-AI-4.1-mini-2025-04-14',
    },
    {
      id: 'claude',
      title: 'Claude API Provider',
      enabled: true,
      key: 'Claude-4.1-mini-2025-04-14',
    },
  ],

  modelProviders: {
    selectedProvider: 'openai' as ProviderId,

    providers: [
      { id: 'openai', label: 'Open AI' },
      { id: 'groq', label: 'Groq' },
      { id: 'google', label: 'Google-Gemini' },
      { id: 'anthropic', label: 'Anthropic' },
      { id: 'ollama', label: 'Ollama' },
    ],

    providerConfigs: {
      openai: {
        functions: [
          {
            key: 'analysis',
            label: 'Analysis Model',
            model: 'gpt-5-mini',
            prompt: '',
          },
          {
            key: 'selection',
            label: 'Selection Model',
            model: 'gpt-5-mini-6',
            prompt: '',
          },
          {
            key: 'result',
            label: 'Result Analysis Model',
            model: 'gpt-5-mini',
            prompt: '',
          },
          {
            key: 'temperature',
            label: 'Temperature',
            model: '0.7',
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
            prompt: '',
          },
          {
            key: 'selection',
            label: 'Selection Model',
            model: 'mixtral',
            prompt: '',
          },
          {
            key: 'result',
            label: 'Result Analysis Model',
            model: 'llama-3',
            prompt: '',
          },
          {
            key: 'temperature',
            label: 'Temperature',
            model: '0.5',
            prompt: '',
          },
        ],
      },
    } as Record<ProviderId, ProviderConfig>,
  },
}

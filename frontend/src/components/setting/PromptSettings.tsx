import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { PromptEditor } from '../common/PromptEditor'

export const PromptSettings = () => {
  const [functionKey, setFunctionKey] = useState('function1')
  const [apiProvider, setApiProvider] = useState('openai')
  const [modelProvider, setModelProvider] = useState('gpt-4')
  const [isEditing, setIsEditing] = useState(false)

  const [prompt, setPrompt] = useState<string>(`
    <p>You are a web page analyst. Extract structural and functional metadata from HTML.</p>

    <p>Analyze this web page structure and return JSON metadata:</p>

    <pre><code>{
  "auth_requirements": {
    "auth_required": boolean,
    "auth_type": "login|registration|none"
  }
}</code></pre>
  `)

  const handleApply = () => {
    console.log({ functionKey, apiProvider, modelProvider })
  }

  const handleSave = () => {
    const plainText = new DOMParser().parseFromString(prompt, 'text/html').body.textContent

    console.log('HTML:', prompt)
    console.log('Plain text:', plainText)

    setIsEditing(false)
  }

  return (
    <div className="w-full max-w-none space-y-6">
      {/* ================= FILTER BAR ================= */}
      <div className="w-full">
        <div className="px-2 py-1">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            {/* FILTERS */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Function */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">Function</label>
                <Select value={functionKey} onValueChange={setFunctionKey}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="function1">Function 1</SelectItem>
                    <SelectItem value="function2">Function 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Provider */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">API Provider</label>
                <Select value={apiProvider} onValueChange={setApiProvider}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="groq">Groq</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Provider */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium">Model Provider</label>
                <Select value={modelProvider} onValueChange={setModelProvider}>
                  <SelectTrigger className="h-9 w-full cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-mini">GPT-4 Mini</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* APPLY BUTTON */}
            <div className="flex items-end">
              <Button
                size="sm"
                className="h-9 w-full lg:w-auto bg-red-500 hover:bg-red-600 px-6 cursor-pointer"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        {/* Header */}
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 border-b">
          <span className="font-medium">Prompt</span>

          {isEditing ? (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 px-4 cursor-pointer"
              onClick={handleSave}
            >
              Save
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-500 px-4 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="min-h-[300px] lg:h-[420px] overflow-y-auto p-4">
          {isEditing ? (
            <PromptEditor value={prompt} isEditing={isEditing} onChange={setPrompt} />
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

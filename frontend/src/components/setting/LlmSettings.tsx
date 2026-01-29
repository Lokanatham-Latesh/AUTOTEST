import { useSettingsByCategoryQuery } from "@/utils/queries/settingQueries"

export const LlmSettings = ({ categoryId }: { categoryId: number }) => {
  const { data, isLoading, isError } = useSettingsByCategoryQuery(categoryId)

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )

  if (isError) return <div>Failed to load settings</div>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">LLM Settings</h2>

      <pre className="text-xs bg-muted p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

import { useSettingsByCategoryQuery } from '@/utils/queries/settingQueries'

export const PromptSettings = ({ categoryId }: { categoryId: number }) => {
  const { data, isLoading, isError } = useSettingsByCategoryQuery(categoryId)

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  if (isError) return <div>Failed to load settings</div>
  return (
    <div>
      <h2>Prompt Settings</h2>
      {data?.data.map((setting) => (
        <div key={setting.id}>
          {/* custom layout for general settings */}
          <label>{setting.title}</label>
          <input defaultValue={setting.actual_value ?? ''} />
        </div>
      ))}

      {/* Provider selector */}
      {/* API key masked input */}
      {/* Conditional UI based on provider */}
    </div>
  )
}

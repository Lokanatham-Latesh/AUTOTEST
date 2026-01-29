import { useState } from 'react'
import { toast } from 'sonner'

import { useSettingsByCategoryQuery } from '@/utils/queries/settingQueries'
import { useBulkUpdateSettingsByCategoryMutation } from '@/utils/queries/settingQueries'

import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '../common/CollapsibleSection'
import { SettingField } from './SettingField'

interface Props {
  categoryId: number
}

export const GeneralSettings = ({ categoryId }: Props) => {
  const { data, isLoading, isError } = useSettingsByCategoryQuery(categoryId)

  const bulkUpdateMutation = useBulkUpdateSettingsByCategoryMutation()

  // const [openApiKey, setOpenApiKey] = useState(true)
  const [openOther, setOpenOther] = useState(true)

  const [editedValues, setEditedValues] = useState<Record<number, string | null>>({})

  const handleChange = (settingId: number, value: string | null) => {
    setEditedValues((prev) => ({
      ...prev,
      [settingId]: value,
    }))
  }

  const handleSave = () => {
    if (Object.keys(editedValues).length === 0) {
      toast.info('No changes to save')
      return
    }

    bulkUpdateMutation.mutate(
      {
        categoryId,
        payload: {
          settings: Object.entries(editedValues).map(([id, value]) => ({
            id: Number(id),
            actual_value: value,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success('Settings updated successfully')
          setEditedValues({})
        },
        onError: () => {
          toast.error('Failed to update settings')
        },
      },
    )
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )

  if (isError) return <div>Failed to load settings</div>

  const settings = data?.data ?? []
  // const apiKeySettings = settings.filter((s) => s.key.startsWith('general.llm.'))

  const otherSettings = settings.filter(
    (s) => s.key.startsWith('general.')
  )

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Settings"
        open={openOther}
        onToggle={() => setOpenOther(!openOther)}
      >
        <div className="grid grid-cols-2 gap-6">
          {otherSettings.map((setting) => (
            <SettingField key={setting.id} setting={setting} onChange={handleChange} />
          ))}
        </div>
      </CollapsibleSection>

      {/* ================= Save Button ================= */}
      <div className="flex justify-end">
        <Button
          className="bg-red-600 hover:bg-red-700 cursor-pointer"
          onClick={handleSave}
          disabled={bulkUpdateMutation.isPending}
        >
          {bulkUpdateMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

import { useParams } from 'react-router-dom'
import { useSidebar } from '@/contexts/SidebarContext'
import { GeneralSettings } from './GeneralSettings'
import { LlmSettings } from './LlmSettings'
import { PromptSettings } from './PromptSettings'

export const SettingsCategoryPage = () => {
  const { categorySlug } = useParams()
  const { settingCategories } = useSidebar()

  const category = settingCategories.find((c) => c.slug === categorySlug)

  if (!category) {
    return <div>Category not found</div>
  }

  switch (category.slug) {
    case 'general-settings':
      return <GeneralSettings categoryId={category.id} />

    case 'llm-settings':
      return <LlmSettings />

    case 'prompt-settings':
      return <PromptSettings />

    default:
      return null
  }
}

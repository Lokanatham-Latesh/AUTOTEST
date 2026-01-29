import { useEffect } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { useSidebar } from '@/contexts/SidebarContext'

export const SettingsLayout = () => {
  const { categorySlug } = useParams()
  const { settingCategories } = useSidebar()
  const navigate = useNavigate()

  useEffect(() => {
    if (!categorySlug && settingCategories.length > 0) {
      navigate(`/settings/${settingCategories[0].slug}`, { replace: true })
    }
  }, [categorySlug, settingCategories, navigate])

  return (
    <div className="h-full">
      <Outlet />
    </div>
  )
}

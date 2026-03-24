import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SIDEBAR_CONFIGS, type SidebarItem, type SidebarConfig } from '@/constants/sidebarConfig'
import { settingApi } from '@/utils/apis/settingApi'
import { useSiteByIdQuery } from '@/utils/queries/sitesQuery'

type SettingCategory = {
  id: number
  title: string
  slug: string
}

type SidebarContextType = {
  // Mobile menu state
  isOpen: boolean
  toggle: () => void
  close: () => void

  // Desktop collapse state
  isCollapsed: boolean
  toggleCollapse: () => void

  // Current sidebar configuration
  items: SidebarItem[]
  showBack: boolean
  backTo: string | null
  backLabel: string | null
  currentConfig: SidebarConfig
  settingCategories: SettingCategory[]

  siteTitle?: string
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const toSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-')

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { pathname } = useLocation()
  const [settingCategories, setSettingCategories] = useState<SettingCategory[]>([])

  //  Extract siteId from URL
  const siteId = useMemo(() => {
    const match = pathname.match(/^\/site-info\/(\d+)/)
    return match ? Number(match[1]) : null
  }, [pathname])

  //  Call API
  const { data: siteData } = useSiteByIdQuery(siteId || 0)

  // Sidebar config
  const currentConfig = useMemo(() => {
    return SIDEBAR_CONFIGS.find((config) => config.pathPattern.test(pathname)) || SIDEBAR_CONFIGS[0]
  }, [pathname])

  // Settings categories
  useEffect(() => {
    if (!settingCategories.length) {
      settingApi.getSettingCategories().then((res) => {
        setSettingCategories(
          res.data.map((c) => ({
            ...c,
            slug: toSlug(c.title),
          })),
        )
      })
    }
  }, [settingCategories.length])

  const value: SidebarContextType = {
    isOpen,
    toggle: () => setIsOpen((prev) => !prev),
    close: () => setIsOpen(false),

    isCollapsed,
    toggleCollapse: () => setIsCollapsed((prev) => !prev),

    items: currentConfig.items,
    showBack: currentConfig.showBack ?? false,
    backTo: currentConfig.backTo ?? null,
    backLabel: currentConfig.backLabel ?? null,
    currentConfig,
    settingCategories,

    // ✅ Pass site title
    siteTitle: siteData?.site_title,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

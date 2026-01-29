import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavItem } from './NavItem'
import mindfireLogo from '@/assets/mindfire-logo.png'
import { useSidebar } from '@/contexts/SidebarContext'

export const Sidebar: React.FC = () => {
  const { isCollapsed, items, showBack, backTo, backLabel, settingCategories } = useSidebar()

  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen border-r border-border bg-background z-20 hidden lg:flex flex-col transition-all',
        isCollapsed ? 'w-20' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="border-b border-border">
        <div className="flex items-center justify-center h-[72px]">
          <img
            src={isCollapsed ? 'https://ourgoalplan.co.in/Images/fire-logo.png' : mindfireLogo}
            alt="Mindfire Logo"
            className="h-[60px]"
          />
        </div>

        {showBack && backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isCollapsed && (backLabel || 'Back')}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <NavItem item={item} isCollapsed={isCollapsed} />

            {item.id === 'settings' && pathname.startsWith('/settings') && !isCollapsed && (
              <div className="ml-9 mt-2 space-y-2">
                {settingCategories.map((cat) => {
                  const isActive = pathname.includes(cat.slug)

                  return (
                    <Link
                      key={cat.id}
                      to={`/settings/${cat.slug}`}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                        isActive
                          ? 'bg-red-50 text-[#FC0101] font-medium'
                          : 'text-muted-foreground hover:bg-accent/50',
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          isActive ? 'bg-[#FC0101]' : 'bg-muted-foreground',
                        )}
                      />

                      {/* TEXT */}
                      <span className={cn(isActive && 'text-[#FC0101]')}>{cat.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  )
}

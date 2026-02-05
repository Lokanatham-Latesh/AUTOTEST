// components/CollapsibleSection.tsx

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  title: string
  children: React.ReactNode
  onSave?: () => void
  loading?: boolean
  disabled?: boolean
}

export const CollapsibleSection = ({
  title,
  children,
  onSave,
  loading = false,
  disabled = false,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false)
  const isSaveDisabled = loading || disabled

  return (
    <div className="border rounded-lg">
      <div className="flex justify-between items-center px-4 py-3 bg-red-50">
        <h3 className="font-semibold">{title}</h3>

        <div className="flex gap-3 items-center">
          {onSave && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={isSaveDisabled}
              className="border-red-500 text-red-500 hover:bg-red-50 font-semibold px-4 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}

          <div onClick={() => setCollapsed(!collapsed)} className="cursor-pointer">
            {collapsed ? <ChevronDown /> : <ChevronUp />}
          </div>
        </div>
      </div>

      {!collapsed && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

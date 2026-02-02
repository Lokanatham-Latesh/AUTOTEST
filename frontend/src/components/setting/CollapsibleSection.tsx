import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const CollapsibleSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-red-50">
        <h3 className="font-semibold">{title}</h3>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50 font-semibold px-4 cursor-pointer"
          >
            Save
          </Button>

          <div onClick={() => setCollapsed(!collapsed)} className="cursor-pointer p-1 transition">
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
        </div>
      </div>

      {!collapsed && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

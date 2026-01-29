interface CollapsibleProps {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}
import { ChevronDown, ChevronUp } from 'lucide-react'

export const CollapsibleSection = ({ title, open, onToggle, children }: CollapsibleProps) => {
  return (
    <div className="rounded-lg border ">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-red-50"
        onClick={onToggle}
      >
        <h3 className="font-semibold ">{title}</h3>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  )
}

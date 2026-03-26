import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Attribute, EditableField, Props } from '@/types/siteAttribute'

type PropsExtended = Props & {
  isLoading?: boolean
}

const SiteAttributeSheet: React.FC<PropsExtended> = ({
  open,
  onClose,
  onSubmit,
  editData,
  siteId,
  isLoading = false,
}) => {
  const isEdit = !!editData

  const [rows, setRows] = useState<Attribute[]>([
    { site_id: siteId, attribute_key: '', attribute_title: '' },
  ])

  useEffect(() => {
    if (editData) {
      setRows([editData])
    } else {
      setRows([{ site_id: siteId, attribute_key: '', attribute_title: '' }])
    }
  }, [editData, siteId])

  const handleChange = (index: number, field: EditableField, value: string) => {
    const updated = [...rows]
    updated[index][field] = value
    setRows(updated)
  }

  const handleAddRow = () => {
    const last = rows[rows.length - 1]
    if (!last.attribute_key || !last.attribute_title) {
      toast.error('Fill current row before adding new')
      return
    }
    setRows([...rows, { site_id: siteId, attribute_key: '', attribute_title: '' }])
  }

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    for (let row of rows) {
      if (!row.attribute_key || !row.attribute_title) {
        toast.error('All fields are required')
        return
      }
    }
    onSubmit(rows)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[420px] flex flex-col p-0">
        <SheetHeader className="border-b px-6 py-4 relative">
          <SheetTitle>{isEdit ? 'Update Site Attribute' : 'Add Site Attributes'}</SheetTitle>
          <button onClick={onClose} className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
          {rows.map((row, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-2">
                <Label>Key</Label>
                <Input
                  value={row.attribute_key}
                  onChange={(e) => handleChange(index, 'attribute_key', e.target.value)}
                />
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <Label>Title</Label>
                <Input
                  value={row.attribute_title}
                  onChange={(e) => handleChange(index, 'attribute_title', e.target.value)}
                />
              </div>

              {!isEdit && (
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="text-red-500 p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {!isEdit && (
            <button onClick={handleAddRow} className="text-red-500 text-sm cursor-pointer">
              + Add More
            </button>
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            >
              {isEdit ? 'Update' : isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default SiteAttributeSheet

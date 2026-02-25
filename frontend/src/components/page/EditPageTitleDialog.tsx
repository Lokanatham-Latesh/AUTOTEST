import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useUpdatePageTitleMutation } from '@/utils/queries/pageQueries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: number | null
  currentTitle?: string
}

export function EditPageTitleDialog({ open, onOpenChange, pageId, currentTitle }: Props) {
  const [title, setTitle] = useState('')
  const updateMutation = useUpdatePageTitleMutation()

  useEffect(() => {
    if (currentTitle) {
      setTitle(currentTitle)
    }
  }, [currentTitle])

  const handleSubmit = () => {
    if (!pageId) return

    updateMutation.mutate(
      {
        pageId,
        payload: { page_title: title },
      },
      {
        onSuccess: () => {
          toast.success('Page title updated successfully')
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.detail || 'Failed to update title')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Page Title</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="cursor-pointer"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

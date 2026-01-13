import { useForm, useFieldArray } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { useEffect } from 'react'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TestScenarioForm } from '@/types/testCase'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TestScenarioForm, id?: string) => void
  initialData?: TestScenarioForm & { id: string }
}

export function TestScenarioSheetForm({ open, onOpenChange, onSubmit, initialData }: Props) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TestScenarioForm>({
    defaultValues: initialData
      ? { ...initialData }
      : {
          title: '',
          type: 'auto',
          category: 'functional',
          description: '',
          steps: [{ value: '' }],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'steps' })

  useEffect(() => {
    if (open) {
      reset(
        initialData
          ? { ...initialData }
          : {
              title: '',
              type: 'auto',
              category: 'functional',
              description: '',
              steps: [{ value: '' }],
            },
      )
    }
  }, [open, initialData, reset])

  const submitHandler = (data: TestScenarioForm) => {
    onSubmit(data, initialData?.id)
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[520px] flex-col p-0">
        <SheetHeader className="relative border-b px-6 py-4">
          <SheetTitle>{initialData ? 'Edit Test Scenario' : 'Add Test Scenario'}</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="flex h-full flex-col">
          <div className="flex-1 space-y-6 px-6 py-6 overflow-auto">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Scenario Type */}
            <div className="space-y-2">
              <Label>Scenario Type</Label>
              <Select
                value={initialData?.type || 'auto'}
                onValueChange={(value) => setValue('type', value as 'auto' | 'manual')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="--Select Option--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-generated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scenario Category */}
            <div className="space-y-2">
              <Label>Scenario Category</Label>
              <Select
                value={initialData?.category || 'functional'}
                onValueChange={(value) =>
                  setValue(
                    'category',
                    value as 'functional' | 'regression' | 'smoke' | 'performance',
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="--Select Option--" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Enter description" rows={4} {...register('description')} />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Step to Execute</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => append({ value: '' })}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Step
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder={`Enter step ${index + 1} here`}
                    {...register(`steps.${index}.value`, { required: 'Step is required' })}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="border-t px-6 py-4">
            <div className="flex w-full justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                {initialData ? 'Update' : 'Add'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

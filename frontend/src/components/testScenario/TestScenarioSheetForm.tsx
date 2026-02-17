import { useForm, useFieldArray } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useUpdateScenarioMutation } from '@/utils/queries/scenarioQueries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
}

type FormValues = {
  title: string
  type: 'auto-generated' | 'manual'
  category:
    | 'functional'
    | 'auth-positive'
    | 'auth-negative'
    | 'ui-validation'
    | 'validation'
    | 'navigation'
    | 'form'
  steps: { value: string }[]
}

export function TestScenarioSheetForm({ open, onOpenChange, initialData }: Props) {
  const updateMutation = useUpdateScenarioMutation()

  const { control, register, handleSubmit, reset, setValue, watch, getValues } =
    useForm<FormValues>({
      defaultValues: {
        title: '',
        type: 'auto-generated',
        category: 'functional',
        steps: [{ value: '' }],
      },
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps',
  })

  // Populate form when editing
  useEffect(() => {
    if (open && initialData) {
      reset({
        title: initialData.title,
        type: initialData.type,
        category: initialData.category,
        steps: initialData.data?.steps?.map((step: any) => ({
          value: `${step.action} - ${step.target}`,
        })) || [{ value: '' }],
      })
    }
  }, [open, initialData, reset])

  // Prevent adding empty step
  const handleAddStep = () => {
    const steps = getValues('steps')
    const lastStep = steps[steps.length - 1]

    if (!lastStep?.value.trim()) {
      toast.error('Please fill the current step before adding another.')
      return
    }

    append({ value: '' })
  }

  const submitHandler = (formData: FormValues) => {
    const formattedSteps = formData.steps.map((step) => {
      const [action, target] = step.value.split(' - ')
      return { action, target }
    })

    const fullData = {
      ...initialData.data,
      steps: formattedSteps,
      title: formData.title,
      category: formData.category,
    }

    updateMutation.mutate(
      {
        scenarioId: initialData.id,
        payload: {
          title: formData.title,
          type: formData.type,
          category: formData.category,
          data: fullData,
        },
      },
      {
        onSuccess: () => {
          toast.success('Scenario updated successfully')
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Failed to update scenario')
        },
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-[520px] flex-col p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Edit Test Scenario</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="flex h-full flex-col">
          <div className="flex-1 space-y-6 px-6 py-6 overflow-auto">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Enter title" {...register('title', { required: true })} />
            </div>

            {/* Scenario Type */}
            <div className="space-y-2">
              <Label>Scenario Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as 'auto-generated' | 'manual')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-generated">Auto-generated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scenario Category */}
            <div className="space-y-2">
              <Label>Scenario Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) =>
                  setValue(
                    'category',
                    value as
                      | 'functional'
                      | 'auth-positive'
                      | 'auth-negative'
                      | 'ui-validation'
                      | 'validation'
                      | 'navigation'
                      | 'form',
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="auth-positive">Auth Positive</SelectItem>
                  <SelectItem value="auth-negative">Auth Negative</SelectItem>
                  <SelectItem value="ui-validation">UI Validation</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Steps</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddStep}>
                  <Plus className="mr-1 h-4 w-4" /> Add Step
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="action - target"
                    {...register(`steps.${index}.value`, { required: true })}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

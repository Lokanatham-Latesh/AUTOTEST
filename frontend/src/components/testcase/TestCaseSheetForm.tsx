import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTestCaseMutation, useTestCaseDetails, useUpdateTestCaseMutation } from '@/utils/queries/testCaseQueries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  testCaseId?: number | null
  scenarioId?: number
}

type FormValues = {
  title: string
  type: 'auto-generated' | 'manual'
  is_valid: boolean
  is_valid_default: boolean
  validation: string
  expected_outcome: string
  data: string
}

export function TestCaseSheetForm({ open, onOpenChange, testCaseId,scenarioId }: Props) {
  const isEditMode = !!testCaseId

  const { data: initialData, isLoading } = useTestCaseDetails(testCaseId ?? 0)

  const updateMutation = useUpdateTestCaseMutation()
  const createMutation = useCreateTestCaseMutation()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      type: 'auto-generated',
      is_valid: true,
      is_valid_default: false,
      validation: '',
      expected_outcome: '',
      data: '',
    },
  })

  // Populate for Edit / Reset for Add
  useEffect(() => {
    if (!open) return

    if (initialData && isEditMode) {
      reset({
        title: initialData.title,
        type: initialData.type,
        is_valid: initialData.is_valid,
        is_valid_default: initialData.is_valid_default,
        validation: initialData.validation ? JSON.stringify(initialData.validation, null, 2) : '',
        expected_outcome: initialData.expected_outcome
          ? JSON.stringify(initialData.expected_outcome, null, 2)
          : '',
        data: initialData.data ? JSON.stringify(initialData.data, null, 2) : '',
      })
    } else {
      reset({
        title: '',
        type: 'auto-generated',
        is_valid: true,
        is_valid_default: false,
        validation: '',
        expected_outcome: '',
        data: '',
      })
    }
  }, [open, initialData, isEditMode, reset])

  const onSubmit = (formData: FormValues) => {
    try {
      const parsedPayload = {
        title: formData.title,
        type: formData.type,
        is_valid: formData.is_valid,
        is_valid_default: formData.is_valid_default,
        validation: formData.validation ? JSON.parse(formData.validation) : null,
        expected_outcome: formData.expected_outcome ? JSON.parse(formData.expected_outcome) : null,
        data: formData.data ? JSON.parse(formData.data) : null,
      }

      if (isEditMode && testCaseId) {
        updateMutation.mutate(
          { testCaseId, payload: parsedPayload },
          {
            onSuccess: () => {
              toast.success('Test case updated successfully')
              onOpenChange(false)
            },
            onError: () => toast.error('Failed to update test case'),
          },
        )
      } else {
        createMutation.mutate(
          {
            test_scenario_id: scenarioId!,
            ...parsedPayload,
          },
          {
            onSuccess: () => {
              toast.success('Test case created successfully')
              onOpenChange(false)
            },
            onError: () => toast.error('Failed to create test case'),
          },
        )
      }
    } catch {
      toast.error('Invalid JSON format')
    }
  }


  if (isEditMode && isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex items-center justify-center w-[520px]">
          Loading...
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full max-h-screen w-[520px] p-0">
        {/* HEADER (Fixed) */}
        <SheetHeader className="border-b px-6 py-4 shrink-0">
          <SheetTitle>{isEditMode ? 'Edit Test Case' : 'Add Test Case'}</SheetTitle>
        </SheetHeader>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as 'auto-generated' | 'manual')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-generated">Auto-Generated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valid */}
            <div className="space-y-2">
              <Label>Valid</Label>
              <Select
                value={watch('is_valid') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_valid', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valid Default */}
            <div className="space-y-2">
              <Label>Valid Default</Label>
              <Select
                value={watch('is_valid_default') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_valid_default', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Validation */}
            <div className="space-y-2">
              <Label>Validation (JSON)</Label>
              <Textarea rows={4} {...register('validation')} />
            </div>

            {/* Expected Outcome */}
            <div className="space-y-2">
              <Label>Expected Outcome (JSON)</Label>
              <Textarea rows={4} {...register('expected_outcome')} />
            </div>

            {/* Test Case Data */}
            <div className="space-y-2">
              <Label>Test Case Data (JSON)</Label>
              <Textarea rows={6} {...register('data')} />
            </div>
          </div>

          {/* FOOTER (Fixed) */}
          <SheetFooter className="border-t px-6 py-4 bg-white shrink-0">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

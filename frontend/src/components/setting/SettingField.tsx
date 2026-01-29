import type { Setting } from '@/types/setting'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Props {
  setting: Setting
  onChange: (settingId: number, value: string | null) => void
}

export const SettingField = ({ setting, onChange }: Props) => {
  const values = setting.possible_values?.split(',').map((v) => v.trim()) ?? []

  const isReadOnlyModelField =
    setting.type === 'Text' &&
    setting.key.includes('.model.') &&
    setting.key !== 'llm.model.provider'

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{setting.title}</Label>

      {/* ================= Dropdown ================= */}
      {setting.type === 'Dropdown' && (
        <Select
          defaultValue={setting.actual_value ?? ''}
          onValueChange={(value) => onChange(setting.id, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {values.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ================= Radio Button ================= */}
      {setting.type === 'Radio Button' && (
        <RadioGroup
          defaultValue={setting.actual_value ?? ''}
          onValueChange={(value) => onChange(setting.id, value)}
          className="flex gap-6 cursor-pointer"
        >
          {values.map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`${setting.id}-${value}`} />
              <Label htmlFor={`${setting.id}-${value}`}>{value}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {/* ================= Text ================= */}
      {setting.type === 'Text' && (
        <Input
          value={setting.actual_value ?? ''}
          readOnly={isReadOnlyModelField}
          className={isReadOnlyModelField ? 'bg-muted cursor-not-allowed' : ''}
          placeholder="Enter value"
          onChange={(e) => onChange(setting.id, e.target.value)}
        />
      )}

      {/* ================= Number ================= */}
      {setting.type === 'Number' && (
        <Input
          type="number"
          step="0.1"
          defaultValue={setting.actual_value ?? ''}
          onChange={(e) => onChange(setting.id, e.target.value)}
        />
      )}
    </div>
  )
}

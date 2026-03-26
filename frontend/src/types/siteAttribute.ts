export type Attribute = {
  id?: number
  site_id: number
  attribute_key: string
  attribute_title: string
}

export type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: Attribute[]) => void
  editData?: Attribute | null
  siteId: number
}
  export type EditableField = 'attribute_key' | 'attribute_title'

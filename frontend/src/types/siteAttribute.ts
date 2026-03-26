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

export type SiteAttribute = {
  id: number
  site_id: number
  attribute_key: string
  attribute_title: string
}

export type SiteAttributeResponse = {
  items: SiteAttribute[]
  total: number
}

export type CreateSiteAttributePayload = {
  site_id: number
  attributes: {
    attribute_key: string
    attribute_title: string
  }[]
}
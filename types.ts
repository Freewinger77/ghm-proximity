export interface Profile {
  id: string
  name: string
  fields: Record<string, string>
  hasUnsavedChanges: boolean
}


export interface ItemType {
  id: string
  code: string
  name: string
  description: string
}

export type ItemTypeInput = Omit<ItemType, 'id'>

export function emptyItemType(): ItemTypeInput {
  return { code: '', name: '', description: '' }
}

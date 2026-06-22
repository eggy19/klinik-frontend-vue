export interface Category {
  id: string
  itemTypeId: string
  code: string
  name: string
  description: string
}

export type CategoryInput = Omit<Category, 'id'>

export function emptyCategory(): CategoryInput {
  return { itemTypeId: '', code: '', name: '', description: '' }
}

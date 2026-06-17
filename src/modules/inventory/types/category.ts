export interface Category {
  id: string
  code: string
  name: string
  description: string
}

/** Payload form (tanpa id, dipakai create/edit). */
export type CategoryInput = Omit<Category, 'id'>

export function emptyCategory(): CategoryInput {
  return {
    code: '',
    name: '',
    description: '',
  }
}

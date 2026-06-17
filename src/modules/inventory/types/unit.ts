export interface Unit {
  id: string
  code: string // singkatan, mis. "tab"
  name: string // mis. "Tablet"
  description: string
}

/** Payload form (tanpa id, dipakai create/edit). */
export type UnitInput = Omit<Unit, 'id'>

export function emptyUnit(): UnitInput {
  return {
    code: '',
    name: '',
    description: '',
  }
}

export interface DrugGroup {
  id: string
  code: string // mis. "OBT_KERAS"
  name: string // mis. "Obat Keras (Daftar G)"
  description: string
  requiresPrescription: boolean
  isActive: boolean
}

/** Payload form (tanpa id, dipakai create/edit). */
export type DrugGroupInput = Omit<DrugGroup, 'id'>

export function emptyDrugGroup(): DrugGroupInput {
  return {
    code: '',
    name: '',
    description: '',
    requiresPrescription: false,
    isActive: true,
  }
}

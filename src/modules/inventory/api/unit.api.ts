import { mockDelay } from '@/api/client'
import { generateId } from '@/utils/id'
import type { Unit, UnitInput } from '../types/unit'

// MOCK DATA LOKAL — lihat catatan di medicine.api.ts.
let units: Unit[] = [
  { id: 'u-001', code: 'tab', name: 'Tablet', description: 'Sediaan padat per butir.' },
  { id: 'u-002', code: 'kap', name: 'Kapsul', description: 'Sediaan padat berbentuk kapsul.' },
  { id: 'u-003', code: 'btl', name: 'Botol', description: 'Sediaan cair per botol.' },
  { id: 'u-004', code: 'box', name: 'Box', description: 'Kemasan kotak.' },
  { id: 'u-005', code: 'strip', name: 'Strip', description: 'Kemasan strip lembaran.' },
  { id: 'u-006', code: 'amp', name: 'Ampul', description: 'Sediaan injeksi per ampul.' },
]

export const unitApi = {
  getUnits(): Promise<Unit[]> {
    return mockDelay([...units])
  },

  createUnit(input: UnitInput): Promise<Unit> {
    const created: Unit = { ...input, id: generateId('u') }
    units = [created, ...units]
    return mockDelay(created)
  },

  updateUnit(id: string, input: UnitInput): Promise<Unit> {
    const updated: Unit = { ...input, id }
    units = units.map((u) => (u.id === id ? updated : u))
    return mockDelay(updated)
  },

  deleteUnit(id: string): Promise<void> {
    units = units.filter((u) => u.id !== id)
    return mockDelay(undefined)
  },
}

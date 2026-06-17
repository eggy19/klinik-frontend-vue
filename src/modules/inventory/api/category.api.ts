import { mockDelay } from '@/api/client'
import { generateId } from '@/utils/id'
import type { Category, CategoryInput } from '../types/category'

// MOCK DATA LOKAL — lihat catatan di medicine.api.ts.
let categories: Category[] = [
  { id: 'c-001', code: 'KAT-01', name: 'Obat Bebas', description: 'Dapat dibeli tanpa resep dokter.' },
  {
    id: 'c-002',
    code: 'KAT-02',
    name: 'Obat Bebas Terbatas',
    description: 'Dijual bebas dengan batasan jumlah dan peringatan.',
  },
  {
    id: 'c-003',
    code: 'KAT-03',
    name: 'Obat Keras',
    description: 'Hanya dapat dibeli dengan resep dokter.',
  },
  { id: 'c-004', code: 'KAT-04', name: 'Alkes', description: 'Alat kesehatan dan penunjang medis.' },
]

export const categoryApi = {
  getCategories(): Promise<Category[]> {
    return mockDelay([...categories])
  },

  createCategory(input: CategoryInput): Promise<Category> {
    const created: Category = { ...input, id: generateId('c') }
    categories = [created, ...categories]
    return mockDelay(created)
  },

  updateCategory(id: string, input: CategoryInput): Promise<Category> {
    const updated: Category = { ...input, id }
    categories = categories.map((c) => (c.id === id ? updated : c))
    return mockDelay(updated)
  },

  deleteCategory(id: string): Promise<void> {
    categories = categories.filter((c) => c.id !== id)
    return mockDelay(undefined)
  },
}

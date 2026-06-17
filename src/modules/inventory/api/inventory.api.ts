import { mockDelay } from '@/api/client'
import { generateId } from '@/utils/id'
import type { Medicine, MedicineInput } from '../types/medicine'

/**
 * MOCK DATA LOKAL.
 *
 * Layer ini mengikuti docs/05 (seluruh komunikasi backend lewat api/).
 * Saat backend siap, ganti isi tiap fungsi agar memakai `apiClient`
 * (axios) dari '@/api/client' dan set VITE_API_BASE_URL.
 */
let medicines: Medicine[] = [
  {
    id: 'm-001',
    code: 'OBT-001',
    name: 'Paracetamol 500mg',
    category: 'Obat Bebas',
    unit: 'Tablet',
    stock: 320,
    minStock: 100,
    price: 500,
    expiryDate: '2027-03-01',
    supplier: 'PT Kimia Farma',
  },
  {
    id: 'm-002',
    code: 'OBT-002',
    name: 'Amoxicillin 500mg',
    category: 'Obat Keras',
    unit: 'Kapsul',
    stock: 45,
    minStock: 80,
    price: 1500,
    expiryDate: '2026-07-15',
    supplier: 'PT Sanbe Farma',
  },
  {
    id: 'm-003',
    code: 'OBT-003',
    name: 'OBH Combi Batuk',
    category: 'Obat Bebas Terbatas',
    unit: 'Botol',
    stock: 60,
    minStock: 30,
    price: 18000,
    expiryDate: '2026-06-30',
    supplier: 'PT Combiphar',
  },
  {
    id: 'm-004',
    code: 'ALK-001',
    name: 'Masker Bedah 3 Ply',
    category: 'Alkes',
    unit: 'Box',
    stock: 8,
    minStock: 20,
    price: 35000,
    expiryDate: '2028-01-01',
    supplier: 'PT Sensi',
  },
  {
    id: 'm-005',
    code: 'OBT-004',
    name: 'Vitamin C 1000mg',
    category: 'Obat Bebas',
    unit: 'Tablet',
    stock: 210,
    minStock: 50,
    price: 2500,
    expiryDate: '2026-09-20',
    supplier: 'PT Kalbe Farma',
  },
]

export const inventoryApi = {
  getMedicines(): Promise<Medicine[]> {
    return mockDelay([...medicines])
  },

  getMedicine(id: string): Promise<Medicine | undefined> {
    return mockDelay(medicines.find((m) => m.id === id))
  },

  createMedicine(input: MedicineInput): Promise<Medicine> {
    const created: Medicine = { ...input, id: generateId('m') }
    medicines = [created, ...medicines]
    return mockDelay(created)
  },

  updateMedicine(id: string, input: MedicineInput): Promise<Medicine> {
    const updated: Medicine = { ...input, id }
    medicines = medicines.map((m) => (m.id === id ? updated : m))
    return mockDelay(updated)
  },

  deleteMedicine(id: string): Promise<void> {
    medicines = medicines.filter((m) => m.id !== id)
    return mockDelay(undefined)
  },
}

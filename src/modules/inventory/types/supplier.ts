export interface Supplier {
  id: string
  code: string
  name: string
  phone: string
  email: string
  address: string
}

export type SupplierInput = Omit<Supplier, 'id'>

export function emptySupplier(): SupplierInput {
  return { code: '', name: '', phone: '', email: '', address: '' }
}

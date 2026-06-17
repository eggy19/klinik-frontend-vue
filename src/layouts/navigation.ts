export interface NavItem {
  label: string
  icon: string
  to?: string
  children?: NavItem[]
}

/** Item navigasi sidebar. Modul/sub-modul baru ditambahkan di sini. */
export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  {
    label: 'Inventory',
    icon: 'pi pi-box',
    children: [
      { label: 'Obat', icon: 'pi pi-tablet', to: '/inventory/obat' },
      { label: 'Kategori', icon: 'pi pi-tags', to: '/inventory/kategori' },
      { label: 'Satuan', icon: 'pi pi-th-large', to: '/inventory/satuan' },
    ],
  },
]

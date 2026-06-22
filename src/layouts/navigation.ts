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
      { label: 'Item', icon: 'pi pi-box', to: '/inventory/obat' },
      { label: 'Kategori', icon: 'pi pi-tags', to: '/inventory/kategori' },
      { label: 'Satuan', icon: 'pi pi-th-large', to: '/inventory/satuan' },
      { label: 'Tipe Item', icon: 'pi pi-list', to: '/inventory/tipe-item' },
      { label: 'Supplier', icon: 'pi pi-truck', to: '/inventory/supplier' },
    ],
  },
]

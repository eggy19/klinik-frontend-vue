export interface NavItem {
  label: string
  icon: string
  to: string
}

/** Item navigasi sidebar. Modul baru ditambahkan di sini. */
export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Inventory', icon: 'pi pi-box', to: '/inventory' },
]

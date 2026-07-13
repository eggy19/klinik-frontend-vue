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
      {
        label: 'Master Data',
        icon: 'pi pi-database',
        children: [
          { label: 'Item', icon: 'pi pi-box', to: '/inventory/obat' },
          { label: 'Kategori', icon: 'pi pi-tags', to: '/inventory/kategori' },
          { label: 'Satuan', icon: 'pi pi-th-large', to: '/inventory/satuan' },
          { label: 'Tipe Item', icon: 'pi pi-list', to: '/inventory/tipe-item' },
          { label: 'Supplier', icon: 'pi pi-truck', to: '/inventory/supplier' },
          { label: 'Golongan Obat', icon: 'pi pi-verified', to: '/inventory/golongan-obat' },
          { label: 'Pengaturan Margin', icon: 'pi pi-percentage', to: '/inventory/margin' },
        ],
      },
      {
        label: 'Purchasing',
        icon: 'pi pi-shopping-cart',
        children: [
          // Belum ada halaman/route — menunggu modul purchasing dibuat.
          { label: 'Purchase Order', icon: 'pi pi-file-edit' },
          { label: 'Good Receipt', icon: 'pi pi-inbox' },
        ],
      },
      {
        label: 'Management',
        icon: 'pi pi-cog',
        children: [
          // Belum ada halaman/route — menunggu modul management dibuat.
          { label: 'Stock', icon: 'pi pi-warehouse' },
          { label: 'Batch', icon: 'pi pi-tags' },
          { label: 'Stock Movement', icon: 'pi pi-arrow-right-arrow-left' },
        ],
      },
    ],
  },
  {
    label: 'Administrasi',
    icon: 'pi pi-shield',
    children: [
      { label: 'Tenant', icon: 'pi pi-building', to: '/admin/tenant' },
      { label: 'Cabang', icon: 'pi pi-sitemap', to: '/admin/cabang' },
      { label: 'Pengguna', icon: 'pi pi-users', to: '/admin/pengguna' },
      { label: 'Sesi Aktif', icon: 'pi pi-desktop', to: '/admin/sesi' },
      { label: 'Riwayat Login', icon: 'pi pi-history', to: '/admin/riwayat-login' },
    ],
  },
]

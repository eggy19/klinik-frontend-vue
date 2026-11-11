export interface NavItem {
  label: string
  icon: string
  to?: string
  children?: NavItem[]
  /** Permission untuk menampilkan menu (spec prasyarat-kasir §7.5.6); kosong = selalu tampil. */
  permission?: string
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
          {
            label: 'Item',
            icon: 'pi pi-box',
            to: '/inventory/master-data/obat',
            permission: 'inventory.item.read',
          },
          {
            label: 'Kategori',
            icon: 'pi pi-tags',
            to: '/inventory/master-data/kategori',
            permission: 'inventory.master_data.read',
          },
          {
            label: 'Satuan',
            icon: 'pi pi-th-large',
            to: '/inventory/master-data/satuan',
            permission: 'inventory.master_data.read',
          },
          {
            label: 'Tipe Item',
            icon: 'pi pi-list',
            to: '/inventory/master-data/tipe-item',
            permission: 'inventory.master_data.read',
          },
          {
            label: 'Supplier',
            icon: 'pi pi-truck',
            to: '/inventory/master-data/supplier',
            permission: 'inventory.supplier.read',
          },
          {
            label: 'Golongan Obat',
            icon: 'pi pi-verified',
            to: '/inventory/master-data/golongan-obat',
            permission: 'inventory.master_data.read',
          },
          {
            label: 'Pengaturan Margin',
            icon: 'pi pi-percentage',
            to: '/inventory/master-data/margin',
            permission: 'inventory.margin_setting.read',
          },
        ],
      },
      {
        label: 'Purchasing',
        icon: 'pi pi-shopping-cart',
        children: [
          {
            label: 'Purchase Order',
            icon: 'pi pi-file-edit',
            to: '/inventory/purchasing/purchase-orders',
            permission: 'inventory.purchase_order.read',
          },
          {
            label: 'Good Receipt',
            icon: 'pi pi-inbox',
            to: '/inventory/purchasing/goods-receipts',
            permission: 'inventory.goods_receipt.read',
          },
        ],
      },
      {
        label: 'Management',
        icon: 'pi pi-cog',
        children: [
          {
            label: 'Stock',
            icon: 'pi pi-warehouse',
            to: '/inventory/management/stock',
            permission: 'inventory.stock.read',
          },
          {
            label: 'Batch',
            icon: 'pi pi-tags',
            to: '/inventory/management/batch',
            permission: 'inventory.stock.read',
          },
          {
            label: 'Stock Movement',
            icon: 'pi pi-arrow-right-arrow-left',
            to: '/inventory/management/stock-movement',
            permission: 'inventory.stock.read',
          },
          {
            label: 'Stock Opname',
            icon: 'pi pi-check-square',
            to: '/inventory/management/stock-opname',
            permission: 'inventory.stock_opname.read',
          },
        ],
      },
      {
        label: 'Dispensing',
        icon: 'pi pi-heart',
        to: '/inventory/dispensing',
        permission: 'inventory.dispensing.read',
      },
    ],
  },
  {
    label: 'Administrasi',
    icon: 'pi pi-shield',
    children: [
      { label: 'Tenant', icon: 'pi pi-building', to: '/admin/tenant', permission: 'identity.tenant.read' },
      { label: 'Cabang', icon: 'pi pi-sitemap', to: '/admin/cabang', permission: 'identity.branch.read' },
      { label: 'Pengguna', icon: 'pi pi-users', to: '/admin/pengguna', permission: 'identity.user.read' },
      { label: 'Sesi Aktif', icon: 'pi pi-desktop', to: '/admin/sesi', permission: 'identity.session.read' },
      {
        label: 'Riwayat Login',
        icon: 'pi pi-history',
        to: '/admin/riwayat-login',
        permission: 'identity.login_history.read',
      },
    ],
  },
]

/**
 * Saring menu berdasarkan permission. Item tanpa permission selalu tampil;
 * menu induk disembunyikan bila tidak ada anak yang tampil (BR-FE-04).
 */
export function filterNavItems(items: NavItem[], can: (code: string) => boolean): NavItem[] {
  const result: NavItem[] = []
  for (const item of items) {
    if (item.children) {
      const children = filterNavItems(item.children, can)
      if (children.length > 0) result.push({ ...item, children })
    } else if (!item.permission || can(item.permission)) {
      result.push(item)
    }
  }
  return result
}

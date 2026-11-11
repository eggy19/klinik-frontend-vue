import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
    layout?: string
    /** Permission yang dibutuhkan (spec prasyarat-kasir §7.5.6); kosong = tidak dibatasi. */
    permission?: string
  }
}

// Route lazy-loaded (docs/07 — lazy loading wajib untuk route).
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { title: 'Masuk', public: true, layout: 'blank' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/modules/auth/views/ForbiddenView.vue'),
    meta: { title: 'Akses Ditolak' },
  },
  // Inventory sebagai menu induk; default ke sub-menu Obat.
  {
    path: '/inventory',
    redirect: '/inventory/master-data/obat',
    children: [
      {
        path: 'master-data',
        redirect: '/inventory/master-data/obat',
        children: [
          {
            path: 'obat',
            name: 'inventory-item',
            component: () => import('@/modules/inventory/views/ItemListView.vue'),
            meta: { title: 'Item', permission: 'inventory.item.read' },
          },
          {
            path: 'obat/baru',
            name: 'inventory-item-create',
            component: () => import('@/modules/inventory/views/ItemFormView.vue'),
            meta: { title: 'Tambah Item', permission: 'inventory.item.read' },
          },
          {
            path: 'obat/:id/edit',
            name: 'inventory-item-edit',
            component: () => import('@/modules/inventory/views/ItemFormView.vue'),
            meta: { title: 'Edit Item', permission: 'inventory.item.read' },
          },
          {
            path: 'kategori',
            name: 'inventory-category',
            component: () => import('@/modules/inventory/views/CategoryListView.vue'),
            meta: { title: 'Kategori', permission: 'inventory.master_data.read' },
          },
          {
            path: 'tipe-item',
            name: 'inventory-item-type',
            component: () => import('@/modules/inventory/views/ItemTypeListView.vue'),
            meta: { title: 'Tipe Item', permission: 'inventory.master_data.read' },
          },
          {
            path: 'satuan',
            name: 'inventory-unit',
            component: () => import('@/modules/inventory/views/UnitListView.vue'),
            meta: { title: 'Satuan', permission: 'inventory.master_data.read' },
          },
          {
            path: 'supplier',
            name: 'inventory-supplier',
            component: () => import('@/modules/inventory/views/SupplierListView.vue'),
            meta: { title: 'Supplier', permission: 'inventory.supplier.read' },
          },
          {
            path: 'golongan-obat',
            name: 'inventory-drug-group',
            component: () => import('@/modules/inventory/views/DrugGroupListView.vue'),
            meta: { title: 'Golongan Obat', permission: 'inventory.master_data.read' },
          },
          {
            path: 'margin',
            name: 'inventory-margin-setting',
            component: () => import('@/modules/inventory/views/MarginSettingView.vue'),
            meta: { title: 'Pengaturan Margin', permission: 'inventory.margin_setting.read' },
          },
        ],
      },
      // Purchasing: Purchase Order + Goods Receipt.
      {
        path: 'purchasing',
        redirect: '/inventory/purchasing/purchase-orders',
        children: [
          {
            path: 'purchase-orders',
            name: 'purchasing-po-list',
            component: () => import('@/modules/purchasing/views/PurchaseOrderListView.vue'),
            meta: { title: 'Purchase Order', permission: 'inventory.purchase_order.read' },
          },
          {
            path: 'purchase-orders/baru',
            name: 'purchasing-po-create',
            component: () => import('@/modules/purchasing/views/PurchaseOrderFormView.vue'),
            meta: { title: 'Buat Purchase Order', permission: 'inventory.purchase_order.read' },
          },
          {
            path: 'purchase-orders/:id/edit',
            name: 'purchasing-po-edit',
            component: () => import('@/modules/purchasing/views/PurchaseOrderFormView.vue'),
            meta: { title: 'Edit Purchase Order', permission: 'inventory.purchase_order.read' },
          },
          {
            path: 'purchase-orders/:id',
            name: 'purchasing-po-detail',
            component: () => import('@/modules/purchasing/views/PurchaseOrderDetailView.vue'),
            meta: { title: 'Detail Purchase Order', permission: 'inventory.purchase_order.read' },
          },
          {
            path: 'goods-receipts',
            name: 'purchasing-gr-list',
            component: () => import('@/modules/purchasing/views/GoodsReceiptListView.vue'),
            meta: { title: 'Goods Receipt', permission: 'inventory.goods_receipt.read' },
          },
          {
            path: 'goods-receipts/baru/:poId',
            name: 'purchasing-gr-create',
            component: () => import('@/modules/purchasing/views/GoodsReceiptCreateView.vue'),
            meta: { title: 'Terima Barang', permission: 'inventory.goods_receipt.read' },
          },
          {
            path: 'goods-receipts/:id',
            name: 'purchasing-gr-detail',
            component: () => import('@/modules/purchasing/views/GoodsReceiptDetailView.vue'),
            meta: { title: 'Detail Goods Receipt', permission: 'inventory.goods_receipt.read' },
          },
        ],
      },
      // Management: monitoring batch, stock, dan stock movement.
      {
        path: 'management',
        redirect: '/inventory/management/batch',
        children: [
          {
            path: 'batch',
            name: 'inventory-batch-list',
            component: () => import('@/modules/inventory/views/InventoryBatchListView.vue'),
            meta: { title: 'Inventory Batch', permission: 'inventory.stock.read' },
          },
          {
            path: 'batch/:id',
            name: 'inventory-batch-detail',
            component: () => import('@/modules/inventory/views/InventoryBatchDetailView.vue'),
            meta: { title: 'Detail Inventory Batch', permission: 'inventory.stock.read' },
          },
          {
            path: 'stock',
            name: 'inventory-stock-list',
            component: () => import('@/modules/inventory/views/InventoryStockListView.vue'),
            meta: { title: 'Stock', permission: 'inventory.stock.read' },
          },
          {
            path: 'stock-movement',
            name: 'inventory-stock-movement-list',
            component: () => import('@/modules/inventory/views/StockMovementListView.vue'),
            meta: { title: 'Stock Movement', permission: 'inventory.stock.read' },
          },
          {
            path: 'stock-opname',
            name: 'inventory-stock-opname-list',
            component: () => import('@/modules/inventory/views/StockOpnameListView.vue'),
            meta: { title: 'Stock Opname', permission: 'inventory.stock_opname.read' },
          },
          {
            path: 'stock-opname/baru',
            name: 'inventory-stock-opname-create',
            component: () => import('@/modules/inventory/views/StockOpnameCreateView.vue'),
            meta: { title: 'Buat Stock Opname', permission: 'inventory.stock_opname.read' },
          },
          {
            path: 'stock-opname/:id',
            name: 'inventory-stock-opname-detail',
            component: () => import('@/modules/inventory/views/StockOpnameDetailView.vue'),
            meta: { title: 'Detail Stock Opname', permission: 'inventory.stock_opname.read' },
          },
        ],
      },
      // Dispensing: input manual dispensing (FEFO stock deduction).
      {
        path: 'dispensing',
        name: 'dispensing-list',
        component: () => import('@/modules/dispensing/views/DispensingListView.vue'),
        meta: { title: 'Dispensing', permission: 'inventory.dispensing.read' },
      },
      {
        path: 'dispensing/baru',
        name: 'dispensing-create',
        component: () => import('@/modules/dispensing/views/DispensingCreateView.vue'),
        meta: { title: 'Buat Dispensing', permission: 'inventory.dispensing.read' },
      },
      {
        path: 'dispensing/:id',
        name: 'dispensing-detail',
        component: () => import('@/modules/dispensing/views/DispensingDetailView.vue'),
        meta: { title: 'Detail Dispensing', permission: 'inventory.dispensing.read' },
      },
    ],
  },
  // Administrasi (data master + keamanan); default ke Tenant.
  {
    path: '/admin',
    redirect: '/admin/tenant',
    children: [
      {
        path: 'tenant',
        name: 'admin-tenant',
        component: () => import('@/modules/admin/views/TenantListView.vue'),
        meta: { title: 'Tenant', permission: 'identity.tenant.read' },
      },
      {
        path: 'cabang',
        name: 'admin-branch',
        component: () => import('@/modules/admin/views/BranchListView.vue'),
        meta: { title: 'Cabang', permission: 'identity.branch.read' },
      },
      {
        path: 'pengguna',
        name: 'admin-user',
        component: () => import('@/modules/admin/views/UserListView.vue'),
        meta: { title: 'Pengguna', permission: 'identity.user.read' },
      },
      {
        path: 'pengguna/:id',
        name: 'admin-user-detail',
        component: () => import('@/modules/admin/views/UserDetailView.vue'),
        meta: { title: 'Detail Pengguna', permission: 'identity.user.read' },
      },
      {
        path: 'sesi',
        name: 'admin-session',
        component: () => import('@/modules/admin/views/SessionManagementView.vue'),
        meta: { title: 'Sesi Aktif', permission: 'identity.session.read' },
      },
      {
        path: 'riwayat-login',
        name: 'admin-login-history',
        component: () => import('@/modules/admin/views/LoginHistoryView.vue'),
        meta: { title: 'Riwayat Login', permission: 'identity.login_history.read' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Cek sesi sekali saat bootstrap app (navigasi pertama), bukan di tiap navigasi.
  if (!authStore.initialized) {
    await authStore.checkAuth()
  }

  const isPublic = to.meta.public === true

  if (!isPublic && !authStore.isAuthenticated) {
    if (to.path !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    }
    return { path: '/login' }
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return { path: '/' }
  }

  // Backend tetap menegakkan permission; ini hanya kenyamanan tampilan (BR-FE-07).
  const required = to.meta.permission
  if (required && !authStore.can(required)) {
    return { path: '/403' }
  }

  return true
})

export default router

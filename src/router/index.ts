import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

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
  // Inventory sebagai menu induk; default ke sub-menu Obat.
  { path: '/inventory', redirect: '/inventory/obat' },
  {
    path: '/inventory/obat',
    name: 'inventory-item',
    component: () => import('@/modules/inventory/views/ItemListView.vue'),
    meta: { title: 'Item' },
  },
  {
    path: '/inventory/obat/baru',
    name: 'inventory-item-create',
    component: () => import('@/modules/inventory/views/ItemFormView.vue'),
    meta: { title: 'Tambah Item' },
  },
  {
    path: '/inventory/obat/:id/edit',
    name: 'inventory-item-edit',
    component: () => import('@/modules/inventory/views/ItemFormView.vue'),
    meta: { title: 'Edit Item' },
  },
  {
    path: '/inventory/kategori',
    name: 'inventory-category',
    component: () => import('@/modules/inventory/views/CategoryListView.vue'),
    meta: { title: 'Kategori' },
  },
  {
    path: '/inventory/tipe-item',
    name: 'inventory-item-type',
    component: () => import('@/modules/inventory/views/ItemTypeListView.vue'),
    meta: { title: 'Tipe Item' },
  },
  {
    path: '/inventory/satuan',
    name: 'inventory-unit',
    component: () => import('@/modules/inventory/views/UnitListView.vue'),
    meta: { title: 'Satuan' },
  },
  {
    path: '/inventory/supplier',
    name: 'inventory-supplier',
    component: () => import('@/modules/inventory/views/SupplierListView.vue'),
    meta: { title: 'Supplier' },
  },
  {
    path: '/inventory/golongan-obat',
    name: 'inventory-drug-group',
    component: () => import('@/modules/inventory/views/DrugGroupListView.vue'),
    meta: { title: 'Golongan Obat' },
  },
  {
    path: '/inventory/margin',
    name: 'inventory-margin-setting',
    component: () => import('@/modules/inventory/views/MarginSettingView.vue'),
    meta: { title: 'Pengaturan Margin' },
  },
  // Administrasi (data master + keamanan); default ke Tenant.
  { path: '/admin', redirect: '/admin/tenant' },
  {
    path: '/admin/tenant',
    name: 'admin-tenant',
    component: () => import('@/modules/admin/views/TenantListView.vue'),
    meta: { title: 'Tenant' },
  },
  {
    path: '/admin/cabang',
    name: 'admin-branch',
    component: () => import('@/modules/admin/views/BranchListView.vue'),
    meta: { title: 'Cabang' },
  },
  {
    path: '/admin/pengguna',
    name: 'admin-user',
    component: () => import('@/modules/admin/views/UserListView.vue'),
    meta: { title: 'Pengguna' },
  },
  {
    path: '/admin/pengguna/:id',
    name: 'admin-user-detail',
    component: () => import('@/modules/admin/views/UserDetailView.vue'),
    meta: { title: 'Detail Pengguna' },
  },
  {
    path: '/admin/sesi',
    name: 'admin-session',
    component: () => import('@/modules/admin/views/SessionManagementView.vue'),
    meta: { title: 'Sesi Aktif' },
  },
  {
    path: '/admin/riwayat-login',
    name: 'admin-login-history',
    component: () => import('@/modules/admin/views/LoginHistoryView.vue'),
    meta: { title: 'Riwayat Login' },
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

  return true
})

export default router

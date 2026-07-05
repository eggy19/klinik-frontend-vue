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

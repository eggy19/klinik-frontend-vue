import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Route lazy-loaded (docs/07 — lazy loading wajib untuk route).
const routes: RouteRecordRaw[] = [
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
    name: 'inventory-medicine',
    component: () => import('@/modules/inventory/views/MedicineListView.vue'),
    meta: { title: 'Obat' },
  },
  {
    path: '/inventory/kategori',
    name: 'inventory-category',
    component: () => import('@/modules/inventory/views/CategoryListView.vue'),
    meta: { title: 'Kategori' },
  },
  {
    path: '/inventory/satuan',
    name: 'inventory-unit',
    component: () => import('@/modules/inventory/views/UnitListView.vue'),
    meta: { title: 'Satuan' },
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

export default router

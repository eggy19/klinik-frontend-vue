import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Route lazy-loaded (docs/07 — lazy loading wajib untuk route).
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/modules/inventory/views/InventoryListView.vue'),
    meta: { title: 'Inventory' },
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

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * State UI global aplikasi: kondisi sidebar dan loading global.
 */
export const useAppStore = defineStore('app', () => {
  // Sidebar collapsed (desktop/tablet) — width 260px <-> 72px.
  const sidebarCollapsed = ref(false)
  // Drawer sidebar terbuka (mobile).
  const sidebarDrawerOpen = ref(false)
  // Loading overlay global (mis. proses panjang).
  const globalLoading = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openDrawer() {
    sidebarDrawerOpen.value = true
  }

  function closeDrawer() {
    sidebarDrawerOpen.value = false
  }

  return {
    sidebarCollapsed,
    sidebarDrawerOpen,
    globalLoading,
    toggleSidebar,
    openDrawer,
    closeDrawer,
  }
})

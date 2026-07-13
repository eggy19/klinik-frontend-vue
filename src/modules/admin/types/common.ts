/** Status entitas master (tenant/branch/user) — selaras dengan enum backend. */
export type EntityStatus = 'active' | 'inactive'

export const STATUS_LABELS: Record<EntityStatus, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
}

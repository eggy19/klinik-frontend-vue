export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Payload endpoint list berpaginasi: `data: { items, meta }`. */
export interface PaginatedData<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  message: string
  error?: unknown
  timestamp?: string
  path?: string
}

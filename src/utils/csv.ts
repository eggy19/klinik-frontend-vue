export interface CsvColumn<T> {
  field: keyof T | string
  header: string
}

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Susun konten CSV dari array baris + definisi kolom. */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.field as string])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

/** Trigger download file CSV di browser. */
export function downloadCsv(filename: string, content: string): void {
  // BOM agar Excel membaca UTF-8 dengan benar.
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

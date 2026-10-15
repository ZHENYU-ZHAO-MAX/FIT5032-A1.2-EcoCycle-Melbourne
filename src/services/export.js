import { jsPDF } from 'jspdf'
import * as autoTablePkg from 'jspdf-autotable'
import { csvSafe } from '../utils/security'

// jspdf-autotable exposes its function differently depending on version / bundler interop,
// so resolve it defensively (default, named, nested default, or the jsPDF plugin method).
const runAutoTable = (doc, options) => {
  const pkg = autoTablePkg
  const fn = [pkg.default, pkg.autoTable, pkg.default?.default, pkg.default?.autoTable].find((f) => typeof f === 'function')
  if (fn) return fn(doc, options)
  if (typeof doc.autoTable === 'function') return doc.autoTable(options)
  throw new Error('jspdf-autotable could not be loaded')
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const cellText = (col, row) => {
  const raw = col.exportValue ? col.exportValue(row) : row[col.key]
  return raw === null || raw === undefined ? '' : String(raw)
}

export const buildCsv = (columns, rows) => {
  const esc = (v) => `"${csvSafe(v).replace(/"/g, '""')}"`
  const header = columns.map((c) => esc(c.label)).join(',')
  const lines = rows.map((r) => columns.map((c) => esc(cellText(c, r))).join(','))
  return [header, ...lines].join('\r\n')
}

export const exportCsv = (filename, columns, rows) => {
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['\ufeff', buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${filename}.csv`)
}

const buildPdf = (title, columns, rows) => {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text(`EcoCycle Melbourne - ${title}`, 40, 40)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleString('en-AU')} - ${rows.length} row(s)`, 40, 56)
  runAutoTable(doc, {
    startY: 70,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => cellText(c, r))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [20, 108, 67] },
    alternateRowStyles: { fillColor: [243, 248, 245] },
    didDrawPage: () => {
      const n = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.text(`Page ${n}`, doc.internal.pageSize.getWidth() - 70, doc.internal.pageSize.getHeight() - 20)
    },
  })
  return doc
}

export const exportPdf = (filename, title, columns, rows) => {
  buildPdf(title, columns, rows).save(`${filename}.pdf`)
}

// ---- iCalendar (.ics) for "Add to calendar" ------------------------------------------------
const icsEscape = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export const buildIcs = (event, durationHours = 2) => {
  const [y, m, d] = event.date.split('-').map(Number)
  const [hh, mm] = (event.time || '09:00').split(':').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (dt) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
  const start = new Date(y, m - 1, d, hh, mm)
  const end = new Date(start.getTime() + durationHours * 3600 * 1000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EcoCycle Melbourne//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@ecocycle-melbourne`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART;TZID=Australia/Melbourne:${fmt(start)}`,
    `DTEND;TZID=Australia/Melbourne:${fmt(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.address || event.location)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export const downloadIcs = (event) => {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
  downloadBlob(blob, `${event.id}.ics`)
}

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
<script setup>
// Reusable interactive table: global search, per-column search, sorting, pagination (10 rows/page),
// optional row selection and CSV / PDF export of the currently filtered rows.
import { ref, reactive, computed, watch } from 'vue'
import { exportCsv, exportPdf } from '../services/export'
import { toast } from '../composables/useToast'

const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, type?, sortable?, searchable?, exportValue?, sortValue? }]
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  caption: { type: String, required: true },
  exportName: { type: String, default: 'export' },
  pageSize: { type: Number, default: 10 },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  hasActions: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'No records found.' },
})
const emit = defineEmits(['update:selected'])

let uidCounter = (globalThis.__dtUid = (globalThis.__dtUid || 0) + 1)
const uid = `dt${uidCounter}`

const globalSearch = ref('')
const colFilters = reactive({})
const sortKey = ref('')
const sortDir = ref('asc')
const page = ref(1)

const valueOf = (col, row) => {
  const v = col.exportValue ? col.exportValue(row) : row[col.key]
  return v === null || v === undefined ? '' : v
}
const sortValueOf = (col, row) => (col.sortValue ? col.sortValue(row) : valueOf(col, row))

const filtered = computed(() => {
  const g = globalSearch.value.trim().toLowerCase()
  let list = props.rows.filter((row) => {
    if (g && !props.columns.some((c) => c.searchable !== false && String(valueOf(c, row)).toLowerCase().includes(g))) return false
    return props.columns.every((c) => {
      const f = (colFilters[c.key] || '').trim().toLowerCase()
      return !f || String(valueOf(c, row)).toLowerCase().includes(f)
    })
  })
  if (sortKey.value) {
    const col = props.columns.find((c) => c.key === sortKey.value)
    if (col) {
      const dir = sortDir.value === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const x = sortValueOf(col, a)
        const y = sortValueOf(col, b)
        if (col.type === 'number') return (Number(x) - Number(y)) * dir
        return String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }) * dir
      })
    }
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / props.pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize))
const rangeStart = computed(() => (filtered.value.length ? (page.value - 1) * props.pageSize + 1 : 0))
const rangeEnd = computed(() => Math.min(page.value * props.pageSize, filtered.value.length))

const pageWindow = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, totalPages.value - 4))
  const end = Math.min(totalPages.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

watch([globalSearch, colFilters, sortKey, sortDir], () => (page.value = 1), { deep: true })
watch(totalPages, (n) => { if (page.value > n) page.value = n })

const toggleSort = (col) => {
  if (col.sortable === false) return
  if (sortKey.value === col.key) {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else { sortKey.value = ''; sortDir.value = 'asc' }
  } else {
    sortKey.value = col.key
    sortDir.value = 'asc'
  }
}
const ariaSort = (col) => (sortKey.value === col.key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : col.sortable === false ? undefined : 'none')

const clearFilters = () => {
  globalSearch.value = ''
  Object.keys(colFilters).forEach((k) => (colFilters[k] = ''))
}
const hasFilters = computed(() => globalSearch.value || Object.values(colFilters).some(Boolean))

// Selection (applies to every row matching the current filters, not just the visible page)
const selectedSet = computed(() => new Set(props.selected))
const filteredKeys = computed(() => filtered.value.map((r) => r[props.rowKey]))
const allSelected = computed(() => filteredKeys.value.length > 0 && filteredKeys.value.every((k) => selectedSet.value.has(k)))
const someSelected = computed(() => filteredKeys.value.some((k) => selectedSet.value.has(k)))
const toggleAll = () => {
  const next = new Set(props.selected)
  if (allSelected.value) filteredKeys.value.forEach((k) => next.delete(k))
  else filteredKeys.value.forEach((k) => next.add(k))
  emit('update:selected', [...next])
}
const toggleRow = (key) => {
  const next = new Set(props.selected)
  next.has(key) ? next.delete(key) : next.add(key)
  emit('update:selected', [...next])
}

// Export
const doCsv = () => {
  if (!filtered.value.length) return toast('Nothing to export.', 'warning')
  exportCsv(props.exportName, props.columns, filtered.value)
  toast(`Exported ${filtered.value.length} row(s) to CSV.`)
}
const doPdf = () => {
  if (!filtered.value.length) return toast('Nothing to export.', 'warning')
  exportPdf(props.exportName, props.caption, props.columns, filtered.value)
  toast(`Exported ${filtered.value.length} row(s) to PDF.`)
}

defineExpose({ filtered })
</script>

<template>
  <section :aria-labelledby="`${uid}-cap`" class="card shadow-sm mb-4">
    <div class="card-body">
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-end mb-3">
        <h3 :id="`${uid}-cap`" class="h5 mb-0">{{ caption }}</h3>
        <div class="d-flex flex-wrap gap-2 align-items-end">
          <div>
            <label :for="`${uid}-search`" class="form-label small mb-0">Search all columns</label>
            <input :id="`${uid}-search`" v-model="globalSearch" type="search" class="form-control form-control-sm" placeholder="Type to search" autocomplete="off" />
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!hasFilters" @click="clearFilters">Clear filters</button>
          <button type="button" class="btn btn-sm btn-outline-eco" @click="doCsv">Export CSV</button>
          <button type="button" class="btn btn-sm btn-outline-eco" @click="doPdf">Export PDF</button>
          <slot name="toolbar" :filtered="filtered" />
        </div>
      </div>

      <div class="table-responsive" role="region" :aria-labelledby="`${uid}-cap`" tabindex="0">
        <table class="table table-striped table-hover align-middle">
          <caption class="visually-hidden">{{ caption }}. Column headers are buttons that sort the table. Use the filter boxes in the second header row to search one column.</caption>
          <thead>
            <tr>
              <th v-if="selectable" scope="col" style="width: 2.5rem">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected && !allSelected"
                  :aria-label="`Select all ${filtered.length} matching rows`"
                  @change="toggleAll"
                />
              </th>
              <th v-for="c in columns" :key="c.key" scope="col" :aria-sort="ariaSort(c)">
                <button v-if="c.sortable !== false" type="button" class="table-sort-btn" @click="toggleSort(c)">
                  {{ c.label }}
                  <span aria-hidden="true">{{ sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕' }}</span>
                  <span class="visually-hidden">, {{ sortKey === c.key ? (sortDir === 'asc' ? 'sorted ascending, activate to sort descending' : 'sorted descending, activate to clear sort') : 'not sorted, activate to sort ascending' }}</span>
                </button>
                <span v-else>{{ c.label }}</span>
              </th>
              <th v-if="hasActions" scope="col">Actions</th>
            </tr>
            <tr>
              <td v-if="selectable"></td>
              <td v-for="c in columns" :key="`f-${c.key}`">
                <input
                  v-if="c.searchable !== false"
                  v-model="colFilters[c.key]"
                  type="search"
                  class="form-control form-control-sm col-filter"
                  :aria-label="`Filter by ${c.label}`"
                  :placeholder="`Filter ${c.label}`"
                  autocomplete="off"
                />
              </td>
              <td v-if="hasActions"></td>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)" class="text-center py-4">
                <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading…
              </td>
            </tr>
            <tr v-else-if="!paged.length">
              <td :colspan="columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)" class="text-center text-muted py-4">{{ hasFilters ? 'No rows match your filters.' : emptyText }}</td>
            </tr>
            <template v-else>
            <tr v-for="row in paged" :key="row[rowKey]" :class="{ 'table-active': selectedSet.has(row[rowKey]) }">
              <td v-if="selectable">
                <input class="form-check-input" type="checkbox" :checked="selectedSet.has(row[rowKey])" :aria-label="`Select row ${row[columns[0].key]}`" @change="toggleRow(row[rowKey])" />
              </td>
              <td v-for="c in columns" :key="c.key">
                <slot :name="`cell-${c.key}`" :row="row" :value="valueOf(c, row)">{{ valueOf(c, row) }}</slot>
              </td>
              <td v-if="hasActions"><slot name="actions" :row="row" /></td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <p class="mb-0 small" role="status" aria-live="polite">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ filtered.length }} row{{ filtered.length === 1 ? '' : 's' }}
          <span v-if="selectable && selected.length"> · {{ selected.length }} selected</span>
        </p>
        <nav :aria-label="`${caption} pagination`">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: page === 1 }">
              <button type="button" class="page-link" :disabled="page === 1" @click="page--">Previous</button>
            </li>
            <li v-for="p in pageWindow" :key="p" class="page-item" :class="{ active: p === page }">
              <button type="button" class="page-link" :aria-current="p === page ? 'page' : undefined" :aria-label="`Page ${p}`" @click="page = p">{{ p }}</button>
            </li>
            <li class="page-item" :class="{ disabled: page === totalPages }">
              <button type="button" class="page-link" :disabled="page === totalPages" @click="page++">Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </section>
</template>

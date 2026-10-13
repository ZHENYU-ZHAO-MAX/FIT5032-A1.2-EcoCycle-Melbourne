<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import EmailComposer from '../components/EmailComposer.vue'
import AnalyticsCharts from '../components/AnalyticsCharts.vue'
import { useEvents } from '../composables/useEvents'
import { useAuth } from '../stores/auth'
import { listRegistrations, listUsers, listEmailLogs, saveEvent, removeEvent, removeRegistration } from '../services/db'
import { setUserRole, apiError } from '../services/api'
import { searchPlaces, hasMapboxToken } from '../services/mapbox'
import { seedEvents } from '../data/seedEvents'
import { formatDate, formatTimestamp } from '../utils/format'
import { sanitizeInput } from '../utils/security'
import { toast } from '../composables/useToast'

const { state } = useAuth()
const { events, loading: eventsLoading } = useEvents()

const tabs = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'events', label: 'Events' },
  { id: 'users', label: 'Users' },
  { id: 'email', label: 'Email' },
]
const tab = ref('analytics')
const onTabKey = (e, i) => {
  let n = i
  if (e.key === 'ArrowRight') n = (i + 1) % tabs.length
  else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length
  else if (e.key === 'Home') n = 0
  else if (e.key === 'End') n = tabs.length - 1
  else return
  e.preventDefault()
  tab.value = tabs[n].id
  document.getElementById(`tab-${tabs[n].id}`)?.focus()
}

const regs = ref([])
const users = ref([])
const logs = ref([])
const loading = ref(true)
const selectedRegs = ref([])

const loadAll = async () => {
  loading.value = true
  try {
    ;[regs.value, users.value, logs.value] = await Promise.all([listRegistrations(), listUsers(), listEmailLogs()])
  } catch (e) {
    toast('Could not load admin data: ' + (e.message || ''), 'danger')
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)

const ts = (t) => (t?.toMillis ? t.toMillis() : 0)

// ---- Registrations table ----
const regColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'eventTitle', label: 'Event' },
  { key: 'eventDate', label: 'Event date' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'phone', label: 'Phone' },
  { key: 'reason', label: 'Reason' },
  { key: 'createdAt', label: 'Registered', exportValue: (r) => formatTimestamp(r.createdAt), sortValue: (r) => ts(r.createdAt), type: 'number' },
]
const selectedEmails = computed(() => regs.value.filter((r) => selectedRegs.value.includes(r.id)).map((r) => r.email))
const deleteReg = async (r) => {
  if (!window.confirm(`Delete ${r.name}'s registration for ${r.eventTitle}?`)) return
  await removeRegistration(r.id)
  selectedRegs.value = selectedRegs.value.filter((id) => id !== r.id)
  toast('Registration deleted.', 'info')
  loadAll()
}

// ---- Events table + form ----
const eventColumns = [
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'location', label: 'Suburb' },
  { key: 'category', label: 'Category' },
  { key: 'capacity', label: 'Capacity', type: 'number' },
  { key: 'ratingAvg', label: 'Avg rating', type: 'number', exportValue: (e) => (e.ratingCount ? (e.ratingSum / e.ratingCount).toFixed(1) : '') },
  { key: 'ratingCount', label: 'Ratings', type: 'number' },
]
const blank = () => ({ id: '', title: '', date: '', time: '09:00', location: '', address: '', category: 'Clean-up', capacity: 30, lat: null, lng: null, description: '' })
const form = ref(blank())
const editing = ref(false)
const formErrors = ref({})
const saving = ref(false)

const editEvent = (e) => { form.value = { ...blank(), ...e }; editing.value = true; document.getElementById('ev-title')?.focus() }
const resetForm = () => { form.value = blank(); editing.value = false; formErrors.value = {} }
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

const findCoords = async () => {
  if (!hasMapboxToken()) return toast('Add VITE_MAPBOX_TOKEN to look up coordinates.', 'warning')
  const q = form.value.address || `${form.value.location} VIC`
  try {
    const [p] = await searchPlaces(q)
    if (!p) return toast('No place found for that address.', 'warning')
    form.value.lat = Number(p.lat.toFixed(5))
    form.value.lng = Number(p.lng.toFixed(5))
    toast(`Coordinates set from "${p.name}".`)
  } catch { toast('Coordinate lookup failed.', 'danger') }
}

const submitEvent = async () => {
  const f = form.value
  const e = {}
  if (!f.title.trim()) e.title = 'Title is required.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) e.date = 'Choose a date.'
  if (!f.location.trim()) e.location = 'Suburb is required.'
  if (!(f.capacity > 0)) e.capacity = 'Capacity must be greater than 0.'
  if (typeof f.lat !== 'number' || typeof f.lng !== 'number' || Number.isNaN(f.lat) || Number.isNaN(f.lng)) e.coords = 'Latitude and longitude are required (use "Find coordinates").'
  formErrors.value = e
  if (Object.keys(e).length) return
  saving.value = true
  try {
    const payload = {
      ...f,
      id: f.id || `${slug(f.title)}-${f.date}`,
      title: sanitizeInput(f.title), location: sanitizeInput(f.location), address: sanitizeInput(f.address), description: sanitizeInput(f.description),
      capacity: Number(f.capacity),
    }
    delete payload.ratingSum; delete payload.ratingCount; delete payload.ratingAvg // maintained by Cloud Functions
    await saveEvent(payload)
    toast(editing.value ? 'Event updated.' : 'Event created.')
    resetForm()
  } catch (err) {
    toast('Could not save the event: ' + (err.message || ''), 'danger')
  } finally {
    saving.value = false
  }
}
const deleteEvent = async (e) => {
  if (!window.confirm(`Delete event "${e.title}"?`)) return
  await removeEvent(e.id)
  toast('Event deleted.', 'info')
}
const seed = async () => {
  await Promise.all(seedEvents.map((e) => saveEvent(e)))
  toast(`Loaded ${seedEvents.length} sample events.`)
}

// ---- Users table ----
const userColumns = [
  { key: 'displayName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'points', label: 'Eco points', type: 'number' },
  { key: 'createdAt', label: 'Joined', exportValue: (u) => formatTimestamp(u.createdAt), sortValue: (u) => ts(u.createdAt), type: 'number' },
]
const changeRole = async (u) => {
  const role = u.role === 'admin' ? 'volunteer' : 'admin'
  if (u.id === state.user.uid) return toast('You cannot change your own role.', 'warning')
  if (!window.confirm(`Change ${u.email} to ${role}?`)) return
  try {
    await setUserRole({ uid: u.id, role })
    toast(`${u.email} is now ${role}. They must log in again to see the change.`)
    loadAll()
  } catch (e) { toast(apiError(e), 'danger') }
}

// ---- Email log table ----
const logColumns = [
  { key: 'sentAt', label: 'Sent', exportValue: (l) => formatTimestamp(l.sentAt), sortValue: (l) => ts(l.sentAt), type: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'recipientCount', label: 'Recipients', type: 'number' },
  { key: 'attachmentCount', label: 'Attachments', type: 'number' },
  { key: 'sentByEmail', label: 'Sent by' },
]
const emailSelected = () => { tab.value = 'email' }
</script>

<template>
  <h1 id="page-heading" tabindex="-1" class="mb-3">Admin dashboard</h1>

  <div role="tablist" aria-label="Admin sections" class="nav nav-tabs mb-3">
    <button
      v-for="(t, i) in tabs" :id="`tab-${t.id}`" :key="t.id" type="button" role="tab" class="nav-link"
      :class="{ active: tab === t.id }" :aria-selected="tab === t.id" :aria-controls="`panel-${t.id}`" :tabindex="tab === t.id ? 0 : -1"
      @click="tab = t.id" @keydown="onTabKey($event, i)"
    >{{ t.label }}</button>
  </div>

  <div v-if="tab === 'analytics'" id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics" tabindex="0"><AnalyticsCharts /></div>

  <div v-else-if="tab === 'registrations'" id="panel-registrations" role="tabpanel" aria-labelledby="tab-registrations" tabindex="0">
    <DataTable v-model:selected="selectedRegs" :columns="regColumns" :rows="regs" caption="Volunteer registrations" export-name="registrations" selectable has-actions :loading="loading">
      <template #cell-reason="{ value }"><span :title="value">{{ value.length > 50 ? value.slice(0, 50) + '…' : value }}</span></template>
      <template #toolbar>
        <button type="button" class="btn btn-sm btn-eco" :disabled="!selectedEmails.length" @click="emailSelected">Email selected ({{ selectedEmails.length }})</button>
      </template>
      <template #actions="{ row }"><button type="button" class="btn btn-sm btn-outline-danger" @click="deleteReg(row)">Delete<span class="visually-hidden"> {{ row.name }}'s registration</span></button></template>
    </DataTable>
  </div>

  <div v-else-if="tab === 'events'" id="panel-events" role="tabpanel" aria-labelledby="tab-events" tabindex="0">
    <form class="card shadow-sm mb-4" novalidate @submit.prevent="submitEvent">
      <div class="card-body">
        <h3 class="h5">{{ editing ? 'Edit event' : 'Add event' }}</h3>
        <div class="row g-3">
          <div class="col-md-6">
            <label for="ev-title" class="form-label">Title</label>
            <input id="ev-title" v-model="form.title" class="form-control" :aria-invalid="!!formErrors.title" />
            <div v-if="formErrors.title" class="text-danger small" role="alert">{{ formErrors.title }}</div>
          </div>
          <div class="col-md-3">
            <label for="ev-date" class="form-label">Date</label>
            <input id="ev-date" v-model="form.date" type="date" class="form-control" :aria-invalid="!!formErrors.date" />
            <div v-if="formErrors.date" class="text-danger small" role="alert">{{ formErrors.date }}</div>
          </div>
          <div class="col-md-3">
            <label for="ev-time" class="form-label">Time</label>
            <input id="ev-time" v-model="form.time" type="time" class="form-control" />
          </div>
          <div class="col-md-4">
            <label for="ev-loc" class="form-label">Suburb</label>
            <input id="ev-loc" v-model="form.location" class="form-control" :aria-invalid="!!formErrors.location" />
            <div v-if="formErrors.location" class="text-danger small" role="alert">{{ formErrors.location }}</div>
          </div>
          <div class="col-md-8">
            <label for="ev-addr" class="form-label">Address</label>
            <input id="ev-addr" v-model="form.address" class="form-control" />
          </div>
          <div class="col-md-3">
            <label for="ev-cat" class="form-label">Category</label>
            <select id="ev-cat" v-model="form.category" class="form-select">
              <option>Clean-up</option><option>Recycling</option><option>Workshop</option><option>Repair</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="ev-cap" class="form-label">Capacity</label>
            <input id="ev-cap" v-model.number="form.capacity" type="number" min="1" class="form-control" :aria-invalid="!!formErrors.capacity" />
          </div>
          <div class="col-md-2">
            <label for="ev-lat" class="form-label">Latitude</label>
            <input id="ev-lat" v-model.number="form.lat" type="number" step="any" class="form-control" />
          </div>
          <div class="col-md-2">
            <label for="ev-lng" class="form-label">Longitude</label>
            <input id="ev-lng" v-model.number="form.lng" type="number" step="any" class="form-control" />
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="button" class="btn btn-outline-eco w-100" @click="findCoords">Find coordinates</button>
          </div>
          <div v-if="formErrors.coords" class="col-12 text-danger small" role="alert">{{ formErrors.coords }}</div>
          <div class="col-12">
            <label for="ev-desc" class="form-label">Description</label>
            <textarea id="ev-desc" v-model="form.description" rows="2" class="form-control"></textarea>
          </div>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button type="submit" class="btn btn-eco" :disabled="saving">{{ editing ? 'Save changes' : 'Add event' }}</button>
          <button v-if="editing" type="button" class="btn btn-outline-secondary" @click="resetForm">Cancel edit</button>
          <button type="button" class="btn btn-outline-secondary ms-auto" @click="seed">Load sample events</button>
        </div>
      </div>
    </form>
    <DataTable :columns="eventColumns" :rows="events" caption="Events" export-name="events" has-actions :loading="eventsLoading">
      <template #cell-date="{ value }">{{ formatDate(value) }}</template>
      <template #actions="{ row }">
        <button type="button" class="btn btn-sm btn-outline-eco me-1" @click="editEvent(row)">Edit<span class="visually-hidden"> {{ row.title }}</span></button>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="deleteEvent(row)">Delete<span class="visually-hidden"> {{ row.title }}</span></button>
      </template>
    </DataTable>
  </div>

  <div v-else-if="tab === 'users'" id="panel-users" role="tabpanel" aria-labelledby="tab-users" tabindex="0">
    <DataTable :columns="userColumns" :rows="users" caption="Users" export-name="users" has-actions :loading="loading">
      <template #actions="{ row }">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="row.id === state.user.uid" @click="changeRole(row)">{{ row.role === 'admin' ? 'Make volunteer' : 'Make admin' }}<span class="visually-hidden"> for {{ row.email }}</span></button>
      </template>
    </DataTable>
  </div>

  <div v-else id="panel-email" role="tabpanel" aria-labelledby="tab-email" tabindex="0">
    <EmailComposer :users="users" :preselected="selectedEmails" @sent="loadAll" />
    <DataTable :columns="logColumns" :rows="logs" caption="Sent email log" export-name="email-log" :loading="loading" empty-text="No emails sent yet." />
  </div>
</template>

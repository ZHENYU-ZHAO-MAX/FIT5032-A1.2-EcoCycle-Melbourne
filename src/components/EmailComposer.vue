<script setup>
// Admin email composer: single / selected / all-volunteer recipients, rich-text-free body, attachments, preview.
import { ref, computed } from 'vue'
import { sendEmail, apiError } from '../services/api'
import { fileToBase64 } from '../services/export'
import { isValidEmail, escapeHtml } from '../utils/security'
import { toast } from '../composables/useToast'

const props = defineProps({
  users: { type: Array, default: () => [] },
  preselected: { type: Array, default: () => [] }, // email addresses
})
const emit = defineEmits(['sent'])

const MAX_BYTES = 5 * 1024 * 1024
const mode = ref(props.preselected.length ? 'selected' : 'all')
const customList = ref('')
const subject = ref('')
const body = ref('')
const files = ref([])
const busy = ref(false)
const errors = ref({})
const resultMsg = ref('')

const volunteerEmails = computed(() => props.users.filter((u) => u.role !== 'admin' && u.email).map((u) => u.email))

const recipients = computed(() => {
  if (mode.value === 'all') return volunteerEmails.value
  if (mode.value === 'selected') return [...new Set(props.preselected)]
  return [...new Set(customList.value.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))]
})

const totalBytes = computed(() => files.value.reduce((n, f) => n + f.size, 0))

const onFiles = (ev) => {
  const picked = [...ev.target.files]
  const next = [...files.value, ...picked]
  if (next.reduce((n, f) => n + f.size, 0) > MAX_BYTES) {
    errors.value = { ...errors.value, files: 'Attachments must total 5 MB or less.' }
  } else {
    files.value = next
    errors.value = { ...errors.value, files: '' }
  }
  ev.target.value = ''
}
const removeFile = (i) => files.value.splice(i, 1)

const validate = () => {
  const e = {}
  const bad = recipients.value.filter((r) => !isValidEmail(r))
  if (!recipients.value.length) e.recipients = 'Choose at least one recipient.'
  else if (bad.length) e.recipients = `Invalid email address: ${bad[0]}`
  else if (recipients.value.length > 500) e.recipients = 'Maximum 500 recipients per send.'
  if (!subject.value.trim()) e.subject = 'Subject is required.'
  else if (subject.value.length > 150) e.subject = 'Subject must be 150 characters or fewer.'
  if (body.value.trim().length < 10) e.body = 'Message must be at least 10 characters.'
  if (totalBytes.value > MAX_BYTES) e.files = 'Attachments must total 5 MB or less.'
  errors.value = e
  return !Object.keys(e).length
}

const send = async () => {
  resultMsg.value = ''
  if (!validate()) return
  if (!window.confirm(`Send this email to ${recipients.value.length} recipient(s)?`)) return
  busy.value = true
  try {
    const attachments = await Promise.all(
      files.value.map(async (f) => ({ filename: f.name, type: f.type || 'application/octet-stream', content: await fileToBase64(f) })),
    )
    const res = await sendEmail({ to: recipients.value, subject: subject.value.trim(), message: body.value, attachments })
    resultMsg.value = `Email sent to ${res.sent} recipient(s).`
    toast(resultMsg.value)
    subject.value = ''
    body.value = ''
    files.value = []
    emit('sent')
  } catch (e) {
    errors.value = { form: apiError(e) }
  } finally {
    busy.value = false
  }
}

const previewHtml = computed(() => escapeHtml(body.value).replace(/\n/g, '<br>'))
</script>

<template>
  <form class="card shadow-sm mb-4" novalidate @submit.prevent="send">
    <div class="card-body">
      <h3 class="h5">Compose email</h3>
      <div v-if="errors.form" class="alert alert-danger" role="alert">{{ errors.form }}</div>
      <div v-if="resultMsg" class="alert alert-success" role="status">{{ resultMsg }}</div>

      <fieldset class="mb-3">
        <legend class="form-label fs-6 fw-semibold">Recipients</legend>
        <div class="form-check form-check-inline">
          <input id="rm-all" v-model="mode" class="form-check-input" type="radio" value="all" /><label class="form-check-label" for="rm-all">All volunteers ({{ volunteerEmails.length }})</label>
        </div>
        <div class="form-check form-check-inline">
          <input id="rm-sel" v-model="mode" class="form-check-input" type="radio" value="selected" /><label class="form-check-label" for="rm-sel">Selected in Registrations table ({{ preselected.length }})</label>
        </div>
        <div class="form-check form-check-inline">
          <input id="rm-cus" v-model="mode" class="form-check-input" type="radio" value="custom" /><label class="form-check-label" for="rm-cus">Custom list</label>
        </div>
        <div v-if="mode === 'custom'" class="mt-2">
          <label for="em-custom" class="form-label small">Email addresses (comma, space or new-line separated)</label>
          <textarea id="em-custom" v-model="customList" rows="2" class="form-control"></textarea>
        </div>
        <div v-if="errors.recipients" class="text-danger small mt-1" role="alert">{{ errors.recipients }}</div>
        <div class="small text-muted mt-1">{{ recipients.length }} recipient(s)</div>
      </fieldset>

      <div class="mb-3">
        <label for="em-subject" class="form-label">Subject</label>
        <input id="em-subject" v-model="subject" class="form-control" maxlength="150" :aria-invalid="!!errors.subject" />
        <div v-if="errors.subject" class="text-danger small" role="alert">{{ errors.subject }}</div>
      </div>

      <div class="mb-3">
        <label for="em-body" class="form-label">Message</label>
        <textarea id="em-body" v-model="body" rows="6" class="form-control" :aria-invalid="!!errors.body"></textarea>
        <div v-if="errors.body" class="text-danger small" role="alert">{{ errors.body }}</div>
      </div>

      <div class="mb-3">
        <label for="em-files" class="form-label">Attachments <span class="text-muted">(max 5 MB total)</span></label>
        <input id="em-files" type="file" multiple class="form-control" @change="onFiles" />
        <div v-if="errors.files" class="text-danger small" role="alert">{{ errors.files }}</div>
        <ul v-if="files.length" class="list-unstyled mt-2 mb-0">
          <li v-for="(f, i) in files" :key="f.name + i" class="d-flex align-items-center gap-2 small">
            📎 {{ f.name }} ({{ (f.size / 1024).toFixed(0) }} KB)
            <button type="button" class="btn btn-sm btn-outline-danger py-0" @click="removeFile(i)">Remove<span class="visually-hidden"> {{ f.name }}</span></button>
          </li>
        </ul>
      </div>

      <details v-if="body" class="mb-3">
        <summary>Preview</summary>
        <div class="border rounded p-3 mt-2 bg-white" v-html="previewHtml"></div>
      </details>

      <button type="submit" class="btn btn-eco" :disabled="busy">
        <span v-if="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Send email
      </button>
    </div>
  </form>
</template>

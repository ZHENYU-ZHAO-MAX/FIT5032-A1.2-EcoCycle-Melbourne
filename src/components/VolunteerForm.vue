<script setup>
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
import { registerForEvent } from '../services/db'
import { sanitizeInput, isValidEmail, looksLikeScript } from '../utils/security'
import { formatDate } from '../utils/format'
import { toast } from '../composables/useToast'

const props = defineProps({ events: { type: Array, default: () => [] } })
const route = useRoute()
const { state, displayName } = useAuth()

const name = ref(displayName.value || '')
const email = ref(state.user?.email || '')
const phone = ref('')
const reason = ref('')
const eventId = ref(typeof route.query.event === 'string' ? route.query.event : '')
const consent = ref(false)
const errors = ref({})
const busy = ref(false)
const submittedEvent = ref(null)
const formError = ref('')

watch(displayName, (v) => { if (!name.value) name.value = v })

const validate = () => {
  const e = {}
  if (!name.value.trim()) e.name = 'Name is required.'
  else if (looksLikeScript(name.value)) e.name = 'Potentially unsafe input detected.'
  if (!isValidEmail(email.value)) e.email = 'Please enter a valid email.'
  if (phone.value && !/^(\+?61|0)[2-478]( ?\d){8}$/.test(phone.value.replace(/[\s-]/g, ' ').trim())) e.phone = 'Enter an Australian phone number, e.g. 0412 345 678.'
  if (!eventId.value) e.event = 'Please choose an event.'
  if (reason.value.trim().length < 20) e.reason = 'Please write at least 20 characters.'
  else if (looksLikeScript(reason.value)) e.reason = 'Potentially unsafe input detected.'
  if (!consent.value) e.consent = 'Please agree to be contacted about this event.'
  errors.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  formError.value = ''
  if (!validate()) return
  const event = props.events.find((x) => x.id === eventId.value)
  busy.value = true
  try {
    await registerForEvent(state.user, event, {
      name: sanitizeInput(name.value),
      email: sanitizeInput(email.value),
      phone: sanitizeInput(phone.value),
      reason: sanitizeInput(reason.value),
    })
    submittedEvent.value = event
    toast('Registration submitted. A confirmation email is on its way!')
  } catch (e) {
    formError.value = e?.code === 'permission-denied'
      ? 'You are already registered for this event (or the registration was rejected).'
      : 'Could not submit your registration. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="submittedEvent" class="alert alert-success" role="status">
    <h3 class="h5">You're in! 🎉</h3>
    <p class="mb-2">Thanks {{ name }}. You are registered for <strong>{{ submittedEvent.title }}</strong> on {{ formatDate(submittedEvent.date) }}. We have emailed a confirmation with a calendar invite (+10 eco points).</p>
    <RouterLink class="btn btn-eco btn-sm me-2" :to="{ name: 'impact' }">View my impact</RouterLink>
    <RouterLink class="btn btn-outline-eco btn-sm" :to="{ name: 'events' }">Back to events</RouterLink>
  </div>

  <form v-else class="card p-4 shadow-sm" novalidate @submit.prevent="submit">
    <div v-if="formError" class="alert alert-danger" role="alert">{{ formError }}</div>

    <div class="mb-3">
      <label for="vf-name" class="form-label">Name</label>
      <input id="vf-name" v-model="name" maxlength="80" class="form-control" :class="{ 'is-invalid': errors.name }" autocomplete="name" required :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'vf-name-err' : undefined" />
      <div v-if="errors.name" id="vf-name-err" class="invalid-feedback d-block">{{ errors.name }}</div>
    </div>
    <div class="mb-3">
      <label for="vf-email" class="form-label">Email</label>
      <input id="vf-email" v-model="email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }" autocomplete="email" required :aria-invalid="!!errors.email" :aria-describedby="errors.email ? 'vf-email-err' : undefined" />
      <div v-if="errors.email" id="vf-email-err" class="invalid-feedback d-block">{{ errors.email }}</div>
    </div>
    <div class="mb-3">
      <label for="vf-phone" class="form-label">Phone <span class="text-muted">(optional)</span></label>
      <input id="vf-phone" v-model="phone" type="tel" class="form-control" :class="{ 'is-invalid': errors.phone }" autocomplete="tel" :aria-invalid="!!errors.phone" :aria-describedby="errors.phone ? 'vf-phone-err' : undefined" />
      <div v-if="errors.phone" id="vf-phone-err" class="invalid-feedback d-block">{{ errors.phone }}</div>
    </div>
    <div class="mb-3">
      <label for="vf-event" class="form-label">Select event</label>
      <select id="vf-event" v-model="eventId" class="form-select" :class="{ 'is-invalid': errors.event }" required :aria-invalid="!!errors.event" :aria-describedby="errors.event ? 'vf-event-err' : undefined">
        <option disabled value="">Please select</option>
        <option v-for="ev in events" :key="ev.id" :value="ev.id">{{ ev.title }} — {{ formatDate(ev.date) }}</option>
      </select>
      <div v-if="errors.event" id="vf-event-err" class="invalid-feedback d-block">{{ errors.event }}</div>
    </div>
    <div class="mb-3">
      <label for="vf-reason" class="form-label">Why do you want to volunteer?</label>
      <textarea id="vf-reason" v-model="reason" rows="4" maxlength="800" class="form-control" :class="{ 'is-invalid': errors.reason }" required aria-describedby="vf-reason-help vf-reason-err" :aria-invalid="!!errors.reason"></textarea>
      <div id="vf-reason-help" class="form-text">Minimum 20 characters ({{ reason.trim().length }} so far).</div>
      <div v-if="errors.reason" id="vf-reason-err" class="invalid-feedback d-block">{{ errors.reason }}</div>
    </div>
    <div class="form-check mb-3">
      <input id="vf-consent" v-model="consent" type="checkbox" class="form-check-input" :class="{ 'is-invalid': errors.consent }" :aria-invalid="!!errors.consent" :aria-describedby="errors.consent ? 'vf-consent-err' : undefined" />
      <label for="vf-consent" class="form-check-label">I agree to be contacted by email about this event.</label>
      <div v-if="errors.consent" id="vf-consent-err" class="invalid-feedback d-block">{{ errors.consent }}</div>
    </div>

    <button type="submit" class="btn btn-eco w-100" :disabled="busy">
      <span v-if="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Submit registration
    </button>
  </form>
</template>

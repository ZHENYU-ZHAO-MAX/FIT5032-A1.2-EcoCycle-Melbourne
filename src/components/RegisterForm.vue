<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth, authErrorMessage } from '../stores/auth'
import { sanitizeInput, isValidEmail, looksLikeScript, passwordIssues } from '../utils/security'
import { toast } from '../composables/useToast'

const router = useRouter()
const { register, loginWithGoogle } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const errors = ref({})
const formError = ref('')
const busy = ref(false)

const validate = () => {
  const e = {}
  if (!name.value.trim()) e.name = 'Name is required.'
  else if (looksLikeScript(name.value)) e.name = 'Potentially unsafe input detected.'
  if (!isValidEmail(email.value)) e.email = 'Enter a valid email address, e.g. name@example.com.'
  const issues = passwordIssues(password.value)
  if (issues.length) e.password = `Password needs ${issues.join(', ')}.`
  if (confirm.value !== password.value) e.confirm = 'Passwords do not match.'
  errors.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  formError.value = ''
  if (!validate()) return
  busy.value = true
  try {
    await register(sanitizeInput(name.value), email.value.trim(), password.value)
    toast('Account created! Check your inbox to verify your email address.')
    router.push('/')
  } catch (e) {
    formError.value = authErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const google = async () => {
  busy.value = true
  formError.value = ''
  try {
    await loginWithGoogle()
    router.push('/')
  } catch (e) {
    formError.value = authErrorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="card shadow-sm p-4" novalidate @submit.prevent="submit">
    <div v-if="formError" class="alert alert-danger" role="alert">{{ formError }}</div>

    <div class="mb-3">
      <label for="reg-name" class="form-label">Full name</label>
      <input id="reg-name" v-model="name" class="form-control" :class="{ 'is-invalid': errors.name }" autocomplete="name" required :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'reg-name-err' : undefined" />
      <div v-if="errors.name" id="reg-name-err" class="invalid-feedback d-block">{{ errors.name }}</div>
    </div>
    <div class="mb-3">
      <label for="reg-email" class="form-label">Email</label>
      <input id="reg-email" v-model="email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }" autocomplete="email" required :aria-invalid="!!errors.email" :aria-describedby="errors.email ? 'reg-email-err' : undefined" />
      <div v-if="errors.email" id="reg-email-err" class="invalid-feedback d-block">{{ errors.email }}</div>
    </div>
    <div class="mb-3">
      <label for="reg-password" class="form-label">Password</label>
      <input id="reg-password" v-model="password" type="password" class="form-control" :class="{ 'is-invalid': errors.password }" autocomplete="new-password" required aria-describedby="reg-pw-help reg-pw-err" :aria-invalid="!!errors.password" />
      <div id="reg-pw-help" class="form-text">At least 8 characters with upper and lower case letters and a number.</div>
      <div v-if="errors.password" id="reg-pw-err" class="invalid-feedback d-block">{{ errors.password }}</div>
    </div>
    <div class="mb-3">
      <label for="reg-confirm" class="form-label">Confirm password</label>
      <input id="reg-confirm" v-model="confirm" type="password" class="form-control" :class="{ 'is-invalid': errors.confirm }" autocomplete="new-password" required :aria-invalid="!!errors.confirm" :aria-describedby="errors.confirm ? 'reg-confirm-err' : undefined" />
      <div v-if="errors.confirm" id="reg-confirm-err" class="invalid-feedback d-block">{{ errors.confirm }}</div>
    </div>

    <button type="submit" class="btn btn-eco w-100 mb-2" :disabled="busy">
      <span v-if="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Create account
    </button>
    <button type="button" class="btn btn-outline-dark w-100 mb-3" :disabled="busy" @click="google"><span aria-hidden="true">G </span>Sign up with Google</button>
    <p class="small mb-0">Already registered? <RouterLink :to="{ name: 'login' }">Log in</RouterLink></p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuth, authErrorMessage } from '../stores/auth'
import { isValidEmail } from '../utils/security'
import { toast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const { login, loginWithGoogle, resetPassword } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref({ email: '', password: '' })
const formError = ref('')
const busy = ref(false)

const validate = () => {
  errors.value.email = isValidEmail(email.value) ? '' : 'Enter a valid email address, e.g. name@example.com.'
  errors.value.password = password.value ? '' : 'Enter your password.'
  return !errors.value.email && !errors.value.password
}

const goNext = () => {
  const target = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
  router.push(target)
}

const submit = async () => {
  formError.value = ''
  if (!validate()) return
  busy.value = true
  try {
    await login(email.value.trim(), password.value)
    toast('Welcome back!')
    goNext()
  } catch (e) {
    formError.value = authErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const google = async () => {
  formError.value = ''
  busy.value = true
  try {
    await loginWithGoogle()
    toast('Signed in with Google.')
    goNext()
  } catch (e) {
    formError.value = authErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const forgot = async () => {
  formError.value = ''
  if (!isValidEmail(email.value)) {
    errors.value.email = 'Enter your email above first, then choose "Forgot password".'
    return
  }
  try {
    await resetPassword(email.value.trim())
  } catch { /* do not reveal whether the account exists */ }
  toast('If an account exists for that email, a password reset link has been sent.', 'info')
}
</script>

<template>
  <form class="card shadow-sm p-4" novalidate @submit.prevent="submit">
    <div v-if="formError" class="alert alert-danger" role="alert">{{ formError }}</div>

    <div class="mb-3">
      <label for="login-email" class="form-label">Email</label>
      <input id="login-email" v-model="email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }" autocomplete="username" required :aria-invalid="!!errors.email" :aria-describedby="errors.email ? 'login-email-err' : undefined" />
      <div v-if="errors.email" id="login-email-err" class="invalid-feedback d-block">{{ errors.email }}</div>
    </div>

    <div class="mb-3">
      <label for="login-password" class="form-label">Password</label>
      <input id="login-password" v-model="password" type="password" class="form-control" :class="{ 'is-invalid': errors.password }" autocomplete="current-password" required :aria-invalid="!!errors.password" :aria-describedby="errors.password ? 'login-pw-err' : undefined" />
      <div v-if="errors.password" id="login-pw-err" class="invalid-feedback d-block">{{ errors.password }}</div>
    </div>

    <button type="submit" class="btn btn-eco w-100 mb-2" :disabled="busy">
      <span v-if="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Log in
    </button>
    <button type="button" class="btn btn-outline-dark w-100 mb-3" :disabled="busy" @click="google">
      <span aria-hidden="true">G </span>Continue with Google
    </button>
    <div class="d-flex justify-content-between small">
      <button type="button" class="btn btn-link btn-sm p-0" @click="forgot">Forgot password?</button>
      <span>No account? <RouterLink :to="{ name: 'register' }">Create one</RouterLink></span>
    </div>
  </form>
</template>

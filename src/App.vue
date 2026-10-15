<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import ToastRegion from './components/ToastRegion.vue'
import { useAuth } from './stores/auth'
import { isFirebaseConfigured } from './firebase'
import { toast } from './composables/useToast'

const router = useRouter()
const { state, isLoggedIn, isAdmin, displayName, logout, resendVerification } = useAuth()

const doLogout = async () => {
  await logout()
  toast('You have been logged out.', 'info')
  router.push('/')
}
const resend = async () => {
  try { await resendVerification(); toast('Verification email sent.', 'info') } catch { toast('Please wait a moment before requesting another email.', 'warning') }
}
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header>
    <nav class="navbar navbar-expand-lg navbar-dark bg-eco" aria-label="Main navigation">
      <div class="container-fluid px-4">
        <RouterLink class="navbar-brand fw-bold" to="/">♻️ EcoCycle Melbourne</RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="mainNav" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><RouterLink class="nav-link" to="/events">Events</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/map">Map</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/resources">Resources</RouterLink></li>
            <li v-if="isLoggedIn && !isAdmin" class="nav-item"><RouterLink class="nav-link" to="/join">Volunteer</RouterLink></li>
            <li v-if="isLoggedIn && !isAdmin" class="nav-item"><RouterLink class="nav-link" to="/impact">My Impact</RouterLink></li>
            <li v-if="isAdmin" class="nav-item"><RouterLink class="nav-link" to="/admin">Admin</RouterLink></li>
          </ul>
          <ul class="navbar-nav align-items-lg-center gap-lg-2">
            <template v-if="isLoggedIn">
              <li class="nav-item text-white small me-lg-2">
                Signed in as <strong>{{ displayName }}</strong>
                <span class="badge bg-light text-dark ms-1">{{ isAdmin ? 'Admin' : 'Volunteer' }}</span>
              </li>
              <li class="nav-item"><button type="button" class="btn btn-light btn-sm" @click="doLogout">Log out</button></li>
            </template>
            <template v-else>
              <li class="nav-item"><RouterLink class="nav-link" to="/login">Log in</RouterLink></li>
              <li class="nav-item"><RouterLink class="btn btn-light btn-sm" to="/register">Sign up</RouterLink></li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  </header>

  <div v-if="!isFirebaseConfigured" class="alert alert-warning rounded-0 mb-0 text-center" role="alert">
    Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your project keys.
  </div>
  <div v-if="isLoggedIn && !state.user.emailVerified" class="alert alert-info rounded-0 mb-0 text-center py-2" role="status">
    Please verify your email address (check your inbox).
    <button type="button" class="btn btn-link btn-sm p-0 align-baseline" @click="resend">Resend verification email</button>
  </div>

  <main id="main-content" tabindex="-1" class="container py-4">
    <RouterView />
  </main>

  <footer class="bg-dark text-white py-3 mt-4">
    <div class="container d-flex flex-wrap justify-content-between gap-2 small">
      <span>© 2026 EcoCycle Melbourne · FIT5032 A3</span>
      <RouterLink class="link-light" to="/accessibility">Accessibility statement</RouterLink>
    </div>
  </footer>

  <ToastRegion />
</template>

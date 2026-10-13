import { createRouter, createWebHistory } from 'vue-router'
import { authReady, useAuth } from '../stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: 'Home' } },
  { path: '/events', name: 'events', component: () => import('../views/EventsView.vue'), meta: { title: 'Events' } },
  { path: '/map', name: 'map', component: () => import('../views/MapView.vue'), meta: { title: 'Event Map' } },
  { path: '/resources', name: 'resources', component: () => import('../views/ResourcesView.vue'), meta: { title: 'Resources' } },
  { path: '/join', name: 'join', component: () => import('../views/JoinView.vue'), meta: { title: 'Volunteer Registration', requiresAuth: true } },
  { path: '/impact', name: 'impact', component: () => import('../views/ImpactView.vue'), meta: { title: 'My Impact', requiresAuth: true } },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true, requiresAdmin: true } },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: 'Log in', guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { title: 'Create account', guestOnly: true } },
  { path: '/accessibility', name: 'accessibility', component: () => import('../views/AccessibilityView.vue'), meta: { title: 'Accessibility Statement' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page not found' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

router.beforeEach(async (to) => {
  await authReady
  const { isLoggedIn, isAdmin } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home', query: { denied: '1' } }
  }
  if (to.meta.guestOnly && isLoggedIn.value) {
    return { name: 'home' }
  }
})

// Accessibility: announce the new page title and move focus to the main heading after navigation.
router.afterEach((to) => {
  document.title = `${to.meta.title || 'EcoCycle'} | EcoCycle Melbourne`
  requestAnimationFrame(() => {
    const target = document.getElementById('page-heading') || document.getElementById('main-content')
    target?.focus({ preventScroll: true })
  })
})

export default router

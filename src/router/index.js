import { createRouter, createWebHistory } from 'vue-router'
import { authReady, useAuth } from '../stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: 'Home' } },
  { path: '/events', name: 'events', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Events' } },  // TODO: EventsView.vue added in a later commit
  { path: '/map', name: 'map', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Event Map' } },  // TODO: MapView.vue added in a later commit
  { path: '/resources', name: 'resources', component: () => import('../views/ResourcesView.vue'), meta: { title: 'Resources' } },
  { path: '/join', name: 'join', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Volunteer Registration', requiresAuth: true } },  // TODO: JoinView.vue added in a later commit
  { path: '/impact', name: 'impact', component: () => import('../views/NotFoundView.vue'), meta: { title: 'My Impact', requiresAuth: true } },  // TODO: ImpactView.vue added in a later commit
  { path: '/admin', name: 'admin', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Admin Dashboard', requiresAuth: true, requiresAdmin: true } },  // TODO: AdminView.vue added in a later commit
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

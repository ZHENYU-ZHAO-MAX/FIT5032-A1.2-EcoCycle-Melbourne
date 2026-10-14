import { reactive, computed } from 'vue'
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, updateProfile, sendPasswordResetEmail, sendEmailVerification,
} from 'firebase/auth'
import { auth } from '../firebase'
import { initUser } from '../services/api'
import { getUserDoc } from '../services/db'

const state = reactive({ user: null, profile: null, role: null, ready: false })

let resolveReady
export const authReady = new Promise((r) => (resolveReady = r))

// Make sure the user has a profile doc + role claim (created by the initUser Cloud Function).
const syncProfile = async (u, displayName) => {
  try {
    let token = await u.getIdTokenResult()
    // Re-check with the server unless already admin, so a later ADMIN_EMAILS change (or email verification) is picked up.
    if (token.claims.role !== 'admin' || displayName) {
      await initUser({ displayName: displayName || u.displayName || '' })
      token = await u.getIdTokenResult(true) // pick up the new custom claim
    }
    state.role = token.claims.role || 'volunteer'
    state.profile = await getUserDoc(u.uid)
  } catch (e) {
    console.error('Profile sync failed', e)
    state.role = state.role || 'volunteer'
  }
}

onAuthStateChanged(auth, async (u) => {
  if (u) {
    state.user = { uid: u.uid, email: u.email, displayName: u.displayName, emailVerified: u.emailVerified, photoURL: u.photoURL }
    await syncProfile(u)
  } else {
    state.user = null
    state.profile = null
    state.role = null
  }
  state.ready = true
  resolveReady()
})

export const useAuth = () => ({
  state,
  isLoggedIn: computed(() => !!state.user),
  isAdmin: computed(() => state.role === 'admin'),
  displayName: computed(() => state.profile?.displayName || state.user?.displayName || state.user?.email || ''),

  async login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  },
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  },
  async register(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    try { await sendEmailVerification(cred.user) } catch (e) { console.warn('verification email failed', e) }
    await syncProfile(cred.user, name)
    state.user = { ...state.user, displayName: name }
  },
  async resendVerification() {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  },
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  },
  async refreshRole() {
    if (auth.currentUser) await syncProfile(auth.currentUser, auth.currentUser.displayName)
  },
  async logout() {
    await signOut(auth)
  },
})

// Map Firebase auth error codes to friendly messages (avoids leaking which part was wrong).
export const authErrorMessage = (e) => {
  switch (e?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Please allow popups and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Authentication failed. Please try again.'
  }
}
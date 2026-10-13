import { ref, onUnmounted } from 'vue'
import { subscribeEvents } from '../services/db'

// Live-subscribed list of events from Firestore.
export const useEvents = () => {
  const events = ref([])
  const loading = ref(true)
  const error = ref('')
  const unsub = subscribeEvents(
    (list) => { events.value = list; loading.value = false },
    () => { error.value = 'Could not load events.'; loading.value = false },
  )
  onUnmounted(unsub)
  return { events, loading, error }
}

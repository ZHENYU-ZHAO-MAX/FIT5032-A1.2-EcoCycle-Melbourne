<script setup>
// Mapbox-powered map: event markers, place search, "near me" nearest events, and turn-by-turn directions.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN } from '../firebase'
import { searchPlaces, getRoute, hasMapboxToken } from '../services/mapbox'
import { haversineKm, formatDate, formatDuration } from '../utils/format'

const props = defineProps({
  events: { type: Array, default: () => [] },
  focusId: { type: String, default: '' },
})

const mapEl = ref(null)
let map = null
let mapReady = false
let eventMarkers = []
let originMarker = null
let searchAbort = null

const origin = ref(null) // { lng, lat, label }
const selectedId = ref(props.focusId || '')
const profile = ref('cycling')
const route = ref(null)
const query = ref('')
const results = ref([])
const status = ref('')
const busy = ref(false)
const error = ref('')

const selectedEvent = computed(() => props.events.find((e) => e.id === selectedId.value) || null)

// Events sorted by distance from the origin (when set)
const listedEvents = computed(() => {
  const list = props.events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number')
  if (!origin.value) return list.map((e) => ({ ...e, distanceKm: null }))
  return list
    .map((e) => ({ ...e, distanceKm: haversineKm(origin.value, e) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
})

const announce = (msg) => { status.value = msg }

const clearRoute = () => {
  route.value = null
  if (mapReady && map.getSource('route')) map.getSource('route').setData({ type: 'FeatureCollection', features: [] })
}

const renderMarkers = () => {
  if (!mapReady) return
  eventMarkers.forEach((m) => m.remove())
  eventMarkers = listedEvents.value.map((e) => {
    const popup = new mapboxgl.Popup({ offset: 28 }).setHTML('<div></div>')
    const content = document.createElement('div')
    const h = document.createElement('strong'); h.textContent = e.title
    const p = document.createElement('div'); p.textContent = `${formatDate(e.date)} · ${e.location}`
    content.append(h, p)
    popup.setDOMContent(content)
    const marker = new mapboxgl.Marker({ color: selectedId.value === e.id ? '#dc3545' : '#146c43' })
      .setLngLat([e.lng, e.lat])
      .setPopup(popup)
      .addTo(map)
    const el = marker.getElement()
    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')
    el.setAttribute('aria-label', `${e.title}, ${e.location}. Press Enter to select.`)
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectEvent(e.id) } })
    el.addEventListener('click', () => selectEvent(e.id))
    return marker
  })
}

const setOrigin = (o) => {
  origin.value = o
  if (originMarker) originMarker.remove()
  if (mapReady) {
    originMarker = new mapboxgl.Marker({ color: '#0d6efd' }).setLngLat([o.lng, o.lat]).setPopup(new mapboxgl.Popup().setText(`Start: ${o.label}`)).addTo(map)
    originMarker.getElement().setAttribute('aria-label', `Your starting point: ${o.label}`)
  }
  clearRoute()
}

const selectEvent = (id) => {
  selectedId.value = id
  const e = props.events.find((x) => x.id === id)
  if (e && mapReady) map.flyTo({ center: [e.lng, e.lat], zoom: 13 })
  renderMarkers()
  announce(e ? `Selected ${e.title}, ${e.location}.` : '')
  if (e && origin.value) showDirections()
}

const nearMe = () => {
  error.value = ''
  if (!navigator.geolocation) { error.value = 'Your browser does not support geolocation. Use the place search instead.'; return }
  busy.value = true
  announce('Finding your location…')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      busy.value = false
      setOrigin({ lng: pos.coords.longitude, lat: pos.coords.latitude, label: 'My location' })
      if (mapReady) map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 11 })
      renderMarkers()
      const first = listedEvents.value[0]
      announce(first ? `Nearest event: ${first.title}, ${first.distanceKm.toFixed(1)} km away.` : 'Location found.')
    },
    () => {
      busy.value = false
      error.value = 'Could not get your location. Allow location access, or search for a place instead.'
    },
    { enableHighAccuracy: false, timeout: 10000 },
  )
}

const doSearch = async () => {
  error.value = ''
  results.value = []
  if (!query.value.trim()) return
  if (searchAbort) searchAbort.abort()
  searchAbort = new AbortController()
  busy.value = true
  try {
    results.value = await searchPlaces(query.value, searchAbort.signal)
    announce(results.value.length ? `${results.value.length} places found.` : 'No places found.')
  } catch (e) {
    if (e.name !== 'AbortError') error.value = 'Place search failed. Please try again.'
  } finally {
    busy.value = false
  }
}

const pickPlace = (p) => {
  setOrigin({ lng: p.lng, lat: p.lat, label: p.name })
  results.value = []
  query.value = p.name
  if (mapReady) map.flyTo({ center: [p.lng, p.lat], zoom: 12 })
  renderMarkers()
  const first = listedEvents.value[0]
  announce(first ? `Start set to ${p.name}. Nearest event: ${first.title}, ${first.distanceKm.toFixed(1)} km away.` : `Start set to ${p.name}.`)
}

const showDirections = async () => {
  error.value = ''
  if (!origin.value) { error.value = 'Set a starting point first: use "Near me" or search for a place.'; return }
  if (!selectedEvent.value) { error.value = 'Select an event first.'; return }
  busy.value = true
  try {
    const r = await getRoute(origin.value, selectedEvent.value, profile.value)
    route.value = r
    if (mapReady) {
      map.getSource('route').setData({ type: 'Feature', geometry: r.geometry })
      const b = r.geometry.coordinates.reduce((bb, c) => bb.extend(c), new mapboxgl.LngLatBounds(r.geometry.coordinates[0], r.geometry.coordinates[0]))
      map.fitBounds(b, { padding: 60 })
    }
    announce(`Route to ${selectedEvent.value.title}: ${r.distanceKm.toFixed(1)} km, about ${formatDuration(r.durationSec)} by ${profile.value}.`)
  } catch {
    route.value = null
    error.value = 'Could not find a route for that travel mode.'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  if (!hasMapboxToken()) return
  mapboxgl.accessToken = MAPBOX_TOKEN
  map = new mapboxgl.Map({ container: mapEl.value, style: 'mapbox://styles/mapbox/streets-v12', center: [144.9631, -37.8136], zoom: 9.5 })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }))
  map.on('load', () => {
    mapReady = true
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#0b5ed7', 'line-width': 6, 'line-opacity': 0.85 } })
    renderMarkers()
    if (selectedId.value) selectEvent(selectedId.value)
  })
})

watch(() => props.events, () => { renderMarkers(); if (selectedId.value && mapReady && !route.value) selectEvent(selectedId.value) }, { deep: true })
watch(() => props.focusId, (id) => { if (id) selectEvent(id) })
watch(profile, () => { if (route.value) showDirections() })

onBeforeUnmount(() => {
  if (searchAbort) searchAbort.abort()
  if (map) map.remove()
})
</script>

<template>
  <div class="row g-4">
    <div class="col-lg-8">
      <div v-if="!hasMapboxToken()" class="alert alert-warning" role="alert">
        The map needs a Mapbox token. Add <code>VITE_MAPBOX_TOKEN</code> to <code>.env.local</code> (see README). The event list on this page still works.
      </div>
      <div
        v-show="hasMapboxToken()"
        ref="mapEl"
        class="map-canvas"
        role="region"
        aria-label="Interactive map of upcoming EcoCycle events. A full list of events with distances and directions is provided beside the map."
      ></div>
      <p class="visually-hidden-focusable small mt-1">Map markers are keyboard focusable. Press Enter on a marker to select that event.</p>
    </div>

    <div class="col-lg-4">
      <form class="mb-3" role="search" @submit.prevent="doSearch">
        <label for="place-search" class="form-label fw-semibold">Search a place to start from</label>
        <div class="input-group">
          <input id="place-search" v-model="query" type="search" class="form-control" placeholder="e.g. Flinders Street Station" autocomplete="off" :disabled="!hasMapboxToken()" />
          <button type="submit" class="btn btn-eco" :disabled="busy || !hasMapboxToken()">Search</button>
        </div>
        <ul v-if="results.length" class="list-group mt-2" aria-label="Place search results">
          <li v-for="r in results" :key="r.id" class="list-group-item p-0">
            <button type="button" class="btn btn-link text-start w-100 text-decoration-none" @click="pickPlace(r)">{{ r.name }}</button>
          </li>
        </ul>
      </form>

      <button type="button" class="btn btn-outline-eco w-100 mb-3" :disabled="busy" @click="nearMe">📍 Find events near me</button>

      <div v-if="origin" class="alert alert-info py-2 small mb-3">Starting from: <strong>{{ origin.label }}</strong></div>

      <div class="mb-3">
        <label for="travel-mode" class="form-label fw-semibold">Travel mode</label>
        <select id="travel-mode" v-model="profile" class="form-select">
          <option value="cycling">Cycling</option>
          <option value="walking">Walking</option>
          <option value="driving">Driving</option>
        </select>
      </div>

      <p class="visually-hidden" role="status" aria-live="polite">{{ status }}</p>
      <p v-if="error" class="alert alert-danger py-2 small" role="alert">{{ error }}</p>
    </div>

    <div class="col-12">
      <h3 class="h5">Events{{ origin ? ' nearest first' : '' }}</h3>
      <ul class="list-group mb-3">
        <li v-for="e in listedEvents" :key="e.id" class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2" :class="{ 'list-group-item-success': e.id === selectedId }">
          <div>
            <strong>{{ e.title }}</strong>
            <div class="small">{{ formatDate(e.date) }} · {{ e.location }}<span v-if="e.distanceKm !== null"> · {{ e.distanceKm.toFixed(1) }} km away</span></div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-eco" :aria-pressed="e.id === selectedId" @click="selectEvent(e.id)">Show<span class="visually-hidden"> {{ e.title }} on map</span></button>
            <button type="button" class="btn btn-sm btn-eco" :disabled="busy" @click="selectedId = e.id; showDirections()">Directions<span class="visually-hidden"> to {{ e.title }}</span></button>
          </div>
        </li>
      </ul>

      <section v-if="route" aria-labelledby="trip-h" class="card card-body shadow-sm">
        <h3 id="trip-h" class="h5">Trip to {{ selectedEvent?.title }}</h3>
        <p class="mb-2"><strong>{{ route.distanceKm.toFixed(1) }} km</strong> · about <strong>{{ formatDuration(route.durationSec) }}</strong> by {{ profile }}</p>
        <ol class="mb-0">
          <li v-for="(s, i) in route.steps" :key="i">{{ s }}</li>
        </ol>
      </section>
    </div>
  </div>
</template>

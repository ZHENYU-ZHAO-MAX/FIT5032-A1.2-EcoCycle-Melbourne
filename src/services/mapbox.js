import { MAPBOX_TOKEN } from '../firebase'

const MELBOURNE = { lng: 144.9631, lat: -37.8136 }
// Rough Greater Melbourne bounding box (minLng,minLat,maxLng,maxLat) to keep search relevant.
const BBOX = '144.4,-38.5,145.9,-37.4'

export const hasMapboxToken = () => Boolean(MAPBOX_TOKEN)

export const searchPlaces = async (text, signal) => {
  if (!text.trim()) return []
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=au&bbox=${BBOX}&proximity=${MELBOURNE.lng},${MELBOURNE.lat}&limit=5&autocomplete=true`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Place search failed')
  const data = await res.json()
  return data.features.map((f) => ({ id: f.id, name: f.place_name, lng: f.center[0], lat: f.center[1] }))
}

// profile: walking | cycling | driving
export const getRoute = async (from, to, profile = 'cycling', signal) => {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Directions request failed')
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found')
  return {
    distanceKm: route.distance / 1000,
    durationSec: route.duration,
    geometry: route.geometry,
    steps: route.legs[0].steps.map((s) => s.maneuver.instruction),
  }
}

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeEvents = (cb, onError) =>
  onSnapshot(
    query(collection(db, 'events'), orderBy('date')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )

export const saveEvent = (event) => {
  const { id, ...data } = event
  return setDoc(doc(db, 'events', id), data, { merge: true })
}
export const removeEvent = (id) => deleteDoc(doc(db, 'events', id))

export const registerForEvent = (user, event, form) =>
  setDoc(doc(db, 'registrations', `${event.id}_${user.uid}`), {
    uid: user.uid,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    suburb: event.location,
    category: event.category || '',
    name: form.name,
    email: form.email,
    phone: form.phone || '',
    reason: form.reason,
    createdAt: serverTimestamp(),
  })

export const listMyRegistrations = async (uid) => {
  const snap = await getDocs(query(collection(db, 'registrations'), where('uid', '==', uid)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const listRegistrations = async () => {
  const snap = await getDocs(query(collection(db, 'registrations'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export const removeRegistration = (id) => deleteDoc(doc(db, 'registrations', id))

export const listUsers = async () => {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const submitRating = (uid, eventId, value) =>
  setDoc(doc(db, 'ratings', `${eventId}_${uid}`), { uid, eventId, value: Number(value), createdAt: serverTimestamp() })

export const getMyRating = async (uid, eventId) => {
  const snap = await getDoc(doc(db, 'ratings', `${eventId}_${uid}`))
  return snap.exists() ? snap.data().value : null
}

export const listEmailLogs = async () => {
  const snap = await getDocs(query(collection(db, 'emailLogs'), orderBy('sentAt', 'desc'), limit(100)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getLeaderboard = async () => {
  const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('points', 'desc'), limit(10)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

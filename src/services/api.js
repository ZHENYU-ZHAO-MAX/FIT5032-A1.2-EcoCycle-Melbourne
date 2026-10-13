import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const call = (name) => async (data) => (await httpsCallable(functions, name)(data)).data

export const initUser = call('initUser')
export const setUserRole = call('setUserRole')
export const sendEmail = call('sendEmail')
export const getAnalytics = call('getAnalytics')

// Turn Firebase callable errors into short messages the UI can show.
export const apiError = (e) => e?.message?.replace(/^.*?:\s*/, '') || 'Something went wrong. Please try again.'

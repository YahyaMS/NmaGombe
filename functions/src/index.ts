import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { decideVerification } from './verification'
export { onMemberWrite } from './directory-projection'
export { logBroadcast } from './broadcast'

import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { decideVerification } from './verification'
export { onMemberWrite } from './directory-projection'
export { logBroadcast } from './broadcast'
export { setMemberStatus, setMemberRole } from './members'
export { markAttendance, unmarkAttendance } from './registrations'

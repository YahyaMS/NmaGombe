/**
 * Every /portal Firestore subscription's onError callback used to assume
 * any failure meant "offline" — but onSnapshot fires the same callback for
 * a genuine network drop AND for a real backend error (a missing composite
 * index, a permissions gap), and those are different problems needing
 * different messages. A missing `jobs` index once shipped to production
 * this way: /portal/jobs told every visitor "you're offline" regardless of
 * their actual connection, which hid the real error from both the member
 * and whoever was debugging the report.
 *
 * navigator.onLine is the cheap, already-reliable signal this project uses
 * elsewhere (CardView.tsx's downloadCard) to tell the two apart: if the
 * browser reports a live connection, a Firestore error here is real, not
 * connectivity.
 */
export function classifyDisconnection(): 'offline' | 'error' {
  return navigator.onLine ? 'error' : 'offline'
}

/**
 * No header, no footer, no nav — design.md §10: "the most austere page on the
 * site, and the one the public judges the institution by. Nothing else exists
 * on this page."
 */
export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', backgroundColor: 'var(--color-paper)' }}>{children}</div>
}

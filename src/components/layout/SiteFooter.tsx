import Link from 'next/link'
import { FooterAccountLink } from './FooterAccountLink'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{ backgroundColor: 'var(--color-green-deep)', color: 'var(--color-surface)' }}
    >
      <div
        className="mx-auto px-md py-xl"
        style={{ maxWidth: 'var(--width-shell)' }}
      >
        {/* Section eyebrow motif */}
        <p
          className="type-eyebrow mb-lg"
          style={{ color: 'rgba(255,255,255,0.55)', borderTop: '3px solid var(--color-green)', paddingTop: 'var(--spacing-sm)' }}
        >
          Nigerian Medical Association · Gombe State Chapter
        </p>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-lg">
          {/* About */}
          <div style={{ maxWidth: '36ch' }}>
            <p
              className="type-small"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Gombe Secretariat — the professional body for medical doctors
              practising in Gombe State.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="list-none m-0 p-0 flex flex-col gap-sm">
              {[
                { href: '/about', label: 'About the chapter' },
                { href: '/executives', label: "State Officers' Committee" },
                { href: '/membership', label: 'Membership' },
                { href: '/contact', label: 'Contact' },
                { href: '/privacy', label: 'Privacy policy' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="type-small transition-colors"
                    style={{
                      color: 'rgba(255,255,255,0.65)',
                      transitionDuration: 'var(--motion-fast)',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mt-xl pt-md"
          style={{ borderTop: '1px solid var(--color-rule-strong)' }}
        >
          <p
            className="type-eyebrow tabular"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            © {year} NMA Gombe State Chapter
          </p>
          <FooterAccountLink />
        </div>

        {/* Attribution. The site was built for the chapter as volunteer work by
            a member of it, which is worth saying plainly and once. */}
        <p
          className="type-small mt-md"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Designed and built for the chapter by Dr Yahya MS — Obstetrics &amp; Gynaecology,
          Federal Teaching Hospital Gombe.
        </p>
      </div>
    </footer>
  )
}

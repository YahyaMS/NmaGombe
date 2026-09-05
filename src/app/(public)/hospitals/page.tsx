/**
 * /hospitals — government and major private hospitals in Gombe State.
 *
 * Static reference content, like /about's affiliate list — not Firestore-backed,
 * because it changes rarely and isn't member-specific.
 *
 * Addresses were cross-checked against the Gombe State Contributory Healthcare
 * Management Agency's approved-provider directory (gmchma.gm.gov.ng/provider/approved,
 * checked 2026-09-05) — a facility only gets an address here if it was named by the
 * chapter AND found on that list under a matching name. A facility named by the
 * chapter but not found there (or found only under a name too different to be
 * confident it's the same place) is listed without one, rather than guessed. No
 * facility from that directory was added here beyond what the chapter named.
 */

import type { Metadata } from 'next'
import { RegisterRow } from '@/components/ui/RegisterRow'

export const metadata: Metadata = {
  title: 'Hospitals in Gombe State',
  description: 'Government and major private hospitals in Gombe State.',
}

interface Hospital {
  name: string
  /** Consultant(s)/medical director(s), for private facilities where named. */
  contact?: string
  address?: string
}

const GOVERNMENT_HOSPITALS: Hospital[] = [
  { name: 'Federal Teaching Hospital Gombe' },
  { name: 'Federal Medical Centre Kumo' },
  { name: 'State Specialist Hospital Gombe', address: 'Unguwan Jekadafari, Gombe' },
  { name: 'Zainab Bulkachuwa Women and Children Hospital Gombe', address: 'Near Idi Anguwan, Bajoga, Gombe' },
  { name: 'General Hospital Kaltungo', address: 'Off Yola Road, Kaltungo' },
  { name: 'General Hospital Bajoga', address: 'Anguwan General, along Potiskum Road, Bajoga' },
  { name: 'General Hospital Kashere', address: 'Opposite Federal University, Kashere' },
  { name: 'General Hospital Billiri', address: 'Pokolin, Billiri' },
  { name: 'General Hospital Deba', address: 'Along Talasse Road, opposite Access Bank, Deba' },
  { name: 'General Hospital Nafada', address: 'Anguwan Dallati, Nafada' },
  { name: 'General Hospital Kumo', address: 'Along Gombe–Yola Road, Kumo' },
  { name: 'Dukku General Hospital', address: 'Gona Quarters, Waziri South, Dukku' },
  { name: 'Cottage Hospital Tumu', address: 'Tumu town, along Kashere Road' },
  { name: 'Cottage Hospital Pindiga', address: 'Along Kashere Road, Pindiga' },
  { name: 'Cottage Hospital Bambam', address: 'Along Yola Road, Bambam' },
  { name: 'Cottage Hospital Bojude', address: 'Along Gombe–Kano Road, Bojude' },
  { name: 'Cottage Hospital Biri', address: 'Birin Bolewa, Nafada' },
  { name: 'Cottage Hospital Hinna', address: 'Along Gombe–Biu Road, Hinna' },
  { name: 'Cottage Hospital Kuri', address: 'Kuri, Yamaltu/Deba LGA' },
  { name: 'Cottage Hospital Putoki', address: 'Near PHC, Putoki, Balanga LGA' },
  { name: 'Cottage Hospital Tula', address: 'Tula Wange, Kaltungo' },
]

const PRIVATE_HOSPITALS: Hospital[] = [
  { name: 'Miyetti Hospital Gombe' },
  { name: 'As-Sahl Hospital', contact: 'Dr. Mustapha Mohammed Kura' },
  { name: 'Thagama Hospital', contact: 'Dr. Ibrahim Mohammed Guduf' },
  { name: 'Flossy Consultant Clinic', contact: 'Dr. Bukar Y. L' },
  {
    name: 'Crown Medicure Diagnostic Services',
    contact: 'Prof. Aminu, Prof. Sani Adamu Gombe, Prof. Manga, Prof. Yusuf',
  },
  { name: 'Metro Consultants Clinic', address: 'Adjacent All Saints’ College, Federal Low-Cost, Gombe' },
  { name: 'Savannah Hospital Gombe' },
  { name: 'Hamdala Specialist Clinic' },
  { name: 'Hyelhara Fertility Clinic' },
  { name: 'Ahajas Memorial Hospital', address: 'Behind Hammadu Kafi Primary School, bypass, Garko, Gombe' },
  { name: 'Madi Memorial Hospital Gombe', address: 'Opposite Tumfure Police Station, Garko, Gombe' },
  { name: 'Doma Hospital Gombe', address: 'No. 5 Kumo Street, Commercial Area, Gombe' },
  { name: 'Al Ihsan Medical Clinic and Diagnostic Services', address: 'Legislative Quarters, Jekadafari, Gombe' },
  {
    name: 'Foresight Specialist Clinic and Diagnostic Services',
    address: 'Off Ajuji Waziri Road, behind Gombe LGA INEC Office, Bajoga, Gombe',
  },
  { name: 'Iman Medical Home Gombe', address: 'Dukku Road, opposite Kawata Printing Press, Gombe' },
]

function hospitalSecondary(h: Hospital): string | undefined {
  return [h.contact, h.address].filter(Boolean).join(' · ') || undefined
}

function HospitalList({ hospitals }: { hospitals: Hospital[] }) {
  return (
    <>
      {hospitals.map((h, i) => (
        <RegisterRow
          key={h.name}
          primary={h.name}
          secondary={hospitalSecondary(h)}
          last={i === hospitals.length - 1}
        />
      ))}
    </>
  )
}

export default function HospitalsPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      <header style={{ backgroundColor: 'var(--color-green-deep)' }}>
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Gombe State Chapter
          </p>
          <h1 className="type-h1" style={{ color: 'var(--color-surface)', maxWidth: '22ch' }}>
            Hospitals in Gombe State
          </h1>
          <p className="type-body-lg" style={{ color: 'rgba(255,255,255,0.70)', marginTop: 'var(--spacing-md)', maxWidth: '48ch' }}>
            Government and major private hospitals where NMA Gombe members practise.
          </p>
        </div>
      </header>

      <section aria-label="Government hospitals">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Government hospitals
          </p>
          <HospitalList hospitals={GOVERNMENT_HOSPITALS} />
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--color-rule)', margin: '0 var(--spacing-md)' }} />

      <section aria-label="Major private hospitals">
        <div className="mx-auto px-md py-xl" style={{ maxWidth: 'var(--width-shell)' }}>
          <p className="type-eyebrow section-rule mb-lg" style={{ color: 'var(--color-ink-3)' }}>
            Major private hospitals
          </p>
          <HospitalList hospitals={PRIVATE_HOSPITALS} />
        </div>
      </section>
    </div>
  )
}

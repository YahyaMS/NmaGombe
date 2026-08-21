'use client'

import { useEffect, useMemo, useState } from 'react'
import { useExecGuard } from '@/lib/auth/useExecGuard'
import { listAllMembers, setMemberStatus, setMemberRole, type MemberRow } from '@/lib/data/membersAdmin'
import { RegisterRow } from '@/components/ui/RegisterRow'
import { inputStyle } from '@/components/ui/Field'

type ListStage = 'checking' | 'ready' | 'error'
type RowAction = 'idle' | 'confirming-suspend' | 'confirming-role' | 'busy'
type Role = 'member' | 'exec' | 'admin'

const statusLabels: Record<MemberRow['status'], string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const roleLabels: Record<Role, string> = {
  member: 'Member',
  exec: 'Exec',
  admin: 'Admin',
}

const primaryButtonStyle = {
  backgroundColor: 'var(--color-green)',
  color: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
} as const

const dangerButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

const ghostButtonStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-ink-2)',
  border: '1px solid var(--color-rule-strong)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
} as const

function matches(row: MemberRow, q: string): boolean {
  const haystack = `${row.displayName} ${row.email} ${row.folioNumber} ${row.department}`.toLowerCase()
  return haystack.includes(q.toLowerCase())
}

export function MembersAdminList() {
  const { state: guardState, uid: ownUid, role: ownRole } = useExecGuard()
  const [listStage, setListStage] = useState<ListStage>('checking')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [search, setSearch] = useState('')

  const [rowAction, setRowAction] = useState<Record<string, RowAction>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})
  const [roleDraft, setRoleDraft] = useState<Record<string, Role>>({})

  useEffect(() => {
    if (guardState !== 'ready') return
    listAllMembers()
      .then((rows) => {
        setMembers(rows)
        setListStage('ready')
      })
      .catch(() => setListStage('error'))
  }, [guardState])

  const results = useMemo(
    () => (search.trim() ? members.filter((m) => matches(m, search.trim())) : members),
    [members, search]
  )

  function draftRole(row: MemberRow): Role {
    return roleDraft[row.uid] ?? row.role
  }

  async function handleSuspendToggle(row: MemberRow) {
    const nextStatus = row.status === 'suspended' ? 'verified' : 'suspended'
    setRowAction((s) => ({ ...s, [row.uid]: 'busy' }))
    setRowError((s) => ({ ...s, [row.uid]: '' }))
    try {
      await setMemberStatus({ uid: row.uid, status: nextStatus })
      setMembers((prev) => prev.map((m) => (m.uid === row.uid ? { ...m, status: nextStatus } : m)))
      setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))
    } catch {
      setRowError((s) => ({ ...s, [row.uid]: "Couldn't update status — try again." }))
      setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))
    }
  }

  async function handleRoleUpdate(row: MemberRow) {
    const nextRole = draftRole(row)
    setRowAction((s) => ({ ...s, [row.uid]: 'busy' }))
    setRowError((s) => ({ ...s, [row.uid]: '' }))
    try {
      await setMemberRole({ uid: row.uid, role: nextRole })
      setMembers((prev) => prev.map((m) => (m.uid === row.uid ? { ...m, role: nextRole } : m)))
      setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))
    } catch {
      setRowError((s) => ({ ...s, [row.uid]: "Couldn't update role — try again." }))
      setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))
    }
  }

  if (guardState !== 'ready' || listStage === 'checking') {
    return <div className="mx-auto px-md py-2xl" style={{ maxWidth: '820px' }} aria-live="polite" />
  }

  return (
    <div className="mx-auto px-md py-2xl" style={{ maxWidth: '820px' }}>
      <p className="type-eyebrow section-rule" style={{ color: 'var(--color-ink-3)' }}>Admin</p>
      <h1 className="type-h2 mt-md" style={{ color: 'var(--color-ink)' }}>Members</h1>
      <p className="type-body mt-sm" style={{ color: 'var(--color-ink-2)' }}>
        Search by name, email, folio number or department.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members"
        aria-label="Search members"
        style={{ ...inputStyle, marginTop: 'var(--spacing-md)' }}
      />

      <div className="mt-lg">
        {listStage === 'error' && (
          <p className="type-body" style={{ color: 'var(--color-ink-2)' }}>
            Couldn&rsquo;t load members. Reload the page.
          </p>
        )}

        {listStage === 'ready' && results.length === 0 && (
          <p className="type-body" style={{ color: 'var(--color-ink-3)' }}>
            No members match your search.
          </p>
        )}

        {listStage === 'ready' &&
          results.map((row, i) => {
            const action = rowAction[row.uid] ?? 'idle'
            const busy = action === 'busy'
            const isSelf = row.uid === ownUid
            const canOfferSuspend = row.status === 'verified' || row.status === 'suspended'
            const pendingRole = draftRole(row)
            const roleChanged = pendingRole !== row.role

            return (
              <div key={row.uid}>
                <RegisterRow
                  primary={row.displayName}
                  secondary={`${roleLabels[row.role]} · ${statusLabels[row.status]} · Folio ${row.folioNumber}`}
                  last={action !== 'confirming-suspend' && action !== 'confirming-role' && i === results.length - 1}
                  action={
                    isSelf ? (
                      <span className="type-small" style={{ color: 'var(--color-ink-3)' }}>
                        This is you
                      </span>
                    ) : (
                      <div className="flex items-center gap-sm flex-wrap">
                        <select
                          value={pendingRole}
                          disabled={busy}
                          onChange={(e) =>
                            setRoleDraft((s) => ({ ...s, [row.uid]: e.target.value as Role }))
                          }
                          style={{ ...inputStyle, width: 'auto', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                        >
                          <option value="member">Member</option>
                          <option value="exec">Exec</option>
                          {ownRole === 'admin' && <option value="admin">Admin</option>}
                        </select>
                        {roleChanged && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              pendingRole === 'admin'
                                ? setRowAction((s) => ({ ...s, [row.uid]: 'confirming-role' }))
                                : handleRoleUpdate(row)
                            }
                            className="type-small font-semibold px-md py-xs"
                            style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
                          >
                            Update role
                          </button>
                        )}
                        {canOfferSuspend && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              row.status === 'suspended'
                                ? handleSuspendToggle(row)
                                : setRowAction((s) => ({ ...s, [row.uid]: 'confirming-suspend' }))
                            }
                            className="type-small font-semibold px-md py-xs"
                            style={{
                              ...(row.status === 'suspended' ? primaryButtonStyle : dangerButtonStyle),
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {row.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    )
                  }
                />

                {action === 'confirming-suspend' && (
                  <div
                    className="flex items-center gap-sm"
                    style={{ paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-rule)' }}
                  >
                    <p className="type-small" style={{ color: 'var(--color-ink-2)' }}>
                      Suspend {row.displayName}? They&rsquo;ll immediately lose member access.
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSuspendToggle(row)}
                      className="type-small font-semibold px-md py-xs"
                      style={{ ...dangerButtonStyle, backgroundColor: 'var(--color-danger)', color: 'var(--color-surface)', opacity: busy ? 0.6 : 1 }}
                    >
                      {busy ? 'Suspending…' : 'Confirm suspend'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))}
                      className="type-small font-semibold px-md py-xs"
                      style={ghostButtonStyle}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {action === 'confirming-role' && (
                  <div
                    className="flex items-center gap-sm"
                    style={{ paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-rule)' }}
                  >
                    <p className="type-small" style={{ color: 'var(--color-ink-2)' }}>
                      Grant {row.displayName} full admin access?
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRoleUpdate(row)}
                      className="type-small font-semibold px-md py-xs"
                      style={{ ...primaryButtonStyle, opacity: busy ? 0.6 : 1 }}
                    >
                      {busy ? 'Updating…' : 'Confirm grant admin'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRowAction((s) => ({ ...s, [row.uid]: 'idle' }))}
                      className="type-small font-semibold px-md py-xs"
                      style={ghostButtonStyle}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {rowError[row.uid] && (
                  <p className="type-small" style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-xs)' }}>
                    {rowError[row.uid]}
                  </p>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

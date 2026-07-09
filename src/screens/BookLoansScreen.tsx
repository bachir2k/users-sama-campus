import type { Palette } from '../theme/palette'
import { useBookLoans, formatLoanDate, type BookLoan, type LoanStatus } from '../lib/bookLoans'
import { Icon } from '../components/ui/Icon'

const DISP = '"Quicksand", system-ui, sans-serif'

const STATUS_LABEL: Record<LoanStatus, string> = {
  returned: 'Rendu',
  active: 'En cours',
  overdue: 'En retard',
}

function statusColors(p: Palette, status: LoanStatus) {
  if (status === 'returned') return { fg: p.ok, bg: p.okSoft }
  if (status === 'overdue') return { fg: p.danger, bg: p.dangerSoft }
  return { fg: p.blue, bg: p.blueSoft }
}

function LoanRow({ l, p }: { l: BookLoan; p: Palette }) {
  const { fg, bg } = statusColors(p, l.status)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: p.surfaceAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name="book" size={19} color={p.brown} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
        <div style={{ fontSize: 12.5, color: p.muted, marginTop: 2 }}>
          Emprunté le {formatLoanDate(l.borrowedAt)} · {l.status === 'returned' && l.returnedAt
            ? `Rendu le ${formatLoanDate(l.returnedAt)}`
            : `À rendre le ${formatLoanDate(l.dueDate)}`}
        </div>
      </div>
      <span style={{
        fontFamily: DISP, fontWeight: 600, fontSize: 12.5,
        color: fg, background: bg,
        padding: '6px 11px', borderRadius: 999, flexShrink: 0,
      }}>
        {STATUS_LABEL[l.status]}
      </span>
    </div>
  )
}

export function BookLoansScreen({ p }: { p: Palette }) {
  const { data, loading, error } = useBookLoans()

  return (
    <div>
      <h2 style={{ margin: '0 0 14px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Emprunts</h2>

      {loading && <div style={{ color: p.muted, fontSize: 14 }}>Chargement…</div>}
      {!loading && error && <div style={{ color: p.muted, fontSize: 14 }}>{error}</div>}

      {!loading && !error && data && (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>En cours</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30, color: p.ink }}>{data.activeCount}</div>
              <div style={{ fontSize: 12, color: p.muted }}>livre{data.activeCount > 1 ? 's' : ''} emprunté{data.activeCount > 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>En retard</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30, color: data.overdueCount > 0 ? p.danger : p.ink }}>{data.overdueCount}</div>
              <div style={{ fontSize: 12, color: p.muted }}>à retourner</div>
            </div>
          </div>

          <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Historique</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.loans.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: p.muted, fontSize: 14, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18 }}>
                Aucun emprunt pour le moment
              </div>
            )}
            {data.loans.map(l => <LoanRow key={l.id} l={l} p={p} />)}
          </div>
        </>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

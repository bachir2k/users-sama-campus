import type { Palette } from '../theme/palette'
import { CAT_COLOR, type Transaction } from '../data/mockData'
import { useStudent } from '../context/StudentContext'
import type { StudentProfile } from '../lib/db'
import { Icon } from '../components/ui/Icon'
import { Money } from '../components/ui/Money'

const DISP = '"Quicksand", system-ui, sans-serif'

interface Props {
  p: Palette
  go: (s: string) => void
}

const CARD_GRAD = 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)'

function MiniCard({ p, student }: { p: Palette; student: StudentProfile }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 22,
      background: CARD_GRAD,
      color: p.cardInk, padding: '20px 22px 18px',
      boxShadow: '0 18px 36px rgba(43,42,38,.22)', overflow: 'hidden',
    }}>
      {/* glow */}
      <div style={{
        position: 'absolute', right: -50, top: -50, width: 170, height: 170,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(226,189,124,.5), transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16 }}>
          Sama<span style={{ color: p.goldSoft }}>Campus</span>
        </div>
        <Icon name="nfc" size={22} color={p.cardInk} strokeWidth={2} style={{ opacity: .85 }} />
      </div>
      <div style={{ marginTop: 16, width: 42, height: 32, borderRadius: 7, background: 'linear-gradient(135deg,#e6c98c,#c79a5d)', position: 'relative', zIndex: 1 }} />
      <div style={{ marginTop: 14, fontFamily: DISP, fontWeight: 600, letterSpacing: '.12em', fontSize: 14 }}>
        {student.num}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .65 }}>Titulaire</div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14 }}>{student.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .65 }}>Promo</div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14 }}>{student.promo.split('·').pop()?.trim() || student.promo}</div>
        </div>
      </div>
    </div>
  )
}

function TxnRow({ t, last, p }: { t: Transaction; last: boolean; p: Palette }) {
  const pos = t.amount > 0
  const zero = t.amount === 0
  const bg = CAT_COLOR[t.cat] ?? p.brown
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0',
      borderBottom: last ? 'none' : `1px solid ${p.line2}`,
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={t.icon} size={19} color="#fff" strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div>
        <div style={{ fontSize: 12.5, color: p.muted, marginTop: 2 }}>{t.when}</div>
      </div>
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15.5, color: zero ? p.muted : pos ? p.ok : p.ink, flexShrink: 0 }}>
        {zero ? 'Accès' : <Money value={t.amount} sign />}
      </div>
    </div>
  )
}

export function HomeScreen({ p, go }: Props) {
  const { student, transactions } = useStudent()
  if (!student) return null
  const quick = [
    { ic: 'plus',     label: 'Recharger', to: 'pay' },
    { ic: 'calendar', label: 'Présences', to: 'presences' },
    { ic: 'book',     label: 'Emprunts',  to: 'loans' },
  ]

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, color: p.muted, fontWeight: 600 }}>Bonjour,</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 28, color: p.ink, letterSpacing: '-.01em' }}>{student.first} 👋</div>
        </div>
        <button style={{ position: 'relative', width: 46, height: 46, borderRadius: 14, border: `1px solid ${p.line}`, background: p.surface, display: 'grid', placeItems: 'center' }}>
          <Icon name="bell" size={21} color={p.ink} />
          <span style={{ position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: 4, background: p.danger, border: `2px solid ${p.surface}` }} />
        </button>
      </div>

      {/* dashboard grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: 24, alignItems: 'start' }}>
        {/* left column */}
        <div>
          <MiniCard p={p} student={student} />

          {/* balance */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '16px 20px', marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>Solde disponible</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink, letterSpacing: '-.01em' }}>
                <Money value={student.balance} />
              </div>
            </div>
            <button
              onClick={() => go('pay')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: p.ink, color: p.surface, border: 'none', borderRadius: 999, padding: '11px 16px', fontFamily: DISP, fontWeight: 600, fontSize: 14 }}
            >
              <Icon name="plus" size={17} color={p.surface} strokeWidth={2.4} /> Recharger
            </button>
          </div>

          {/* quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 16 }}>
            {quick.map(q => (
              <button key={q.label} onClick={() => go(q.to)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 16px' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: p.surfaceAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={q.ic} size={20} color={p.brown} />
                </span>
                <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 13.5, color: p.ink2 }}>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* right column — recent activity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontFamily: DISP, fontWeight: 700, fontSize: 19, color: p.ink }}>Activité récente</h3>
            <button onClick={() => go('history')} style={{ background: 'none', border: 'none', color: p.brown, fontFamily: DISP, fontWeight: 600, fontSize: 13.5 }}>Tout voir</button>
          </div>
          <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '4px 18px' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: p.muted, fontSize: 14 }}>Aucune activité récente</div>
            ) : (
              transactions.slice(0, 6).map((t, i, a) => <TxnRow key={t.id} t={t} p={p} last={i === a.length - 1} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

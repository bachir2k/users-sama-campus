import { Palette } from '../theme/palette'
import { STUDENT, TXNS, CAT_COLOR } from '../data/mockData'
import { Icon } from '../components/ui/Icon'
import { Money } from '../components/ui/Money'

const DISP = '"Quicksand", system-ui, sans-serif'

interface Props {
  p: Palette
  go: (s: string) => void
}

const CARD_GRAD = 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)'

function MiniCard({ p }: { p: Palette }) {
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
        {STUDENT.num}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .65 }}>Titulaire</div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14 }}>{STUDENT.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .65 }}>Promo</div>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14 }}>2026</div>
        </div>
      </div>
    </div>
  )
}

function TxnRow({ t, last, p }: { t: typeof TXNS[0]; last: boolean; p: Palette }) {
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
  const quick = [
    { ic: 'plus',     label: 'Recharger', to: 'pay-recharge' },
    { ic: 'pay',      label: 'Payer',     to: 'pay-pay' },
    { ic: 'qr',       label: 'Accès',     to: 'access' },
    { ic: 'calendar', label: 'Présences', to: 'presences' },
  ]

  return (
    <div>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13.5, color: p.muted, fontWeight: 600 }}>Bonjour,</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 23, color: p.ink, letterSpacing: '-.01em' }}>{STUDENT.first} 👋</div>
        </div>
        <button style={{ position: 'relative', width: 44, height: 44, borderRadius: 13, border: `1px solid ${p.line}`, background: p.surface, display: 'grid', placeItems: 'center' }}>
          <Icon name="bell" size={21} color={p.ink} />
          <span style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, background: p.danger, border: `2px solid ${p.surface}` }} />
        </button>
      </div>

      <MiniCard p={p} />

      {/* balance */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 18px', marginTop: 14 }}>
        <div>
          <div style={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>Solde disponible</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink, letterSpacing: '-.01em' }}>
            <Money value={STUDENT.balance} />
          </div>
        </div>
        <button
          onClick={() => go('pay-recharge')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: p.ink, color: p.surface, border: 'none', borderRadius: 999, padding: '11px 16px', fontFamily: DISP, fontWeight: 600, fontSize: 14 }}
        >
          <Icon name="plus" size={17} color={p.surface} strokeWidth={2.4} /> Recharger
        </button>
      </div>

      {/* quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
        {quick.map(q => (
          <button key={q.label} onClick={() => go(q.to)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 4px' }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: p.surfaceAlt, display: 'grid', placeItems: 'center' }}>
              <Icon name={q.ic} size={20} color={p.brown} />
            </span>
            <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 11.5, color: p.ink2 }}>{q.label}</span>
          </button>
        ))}
      </div>

      {/* recent activity */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 0 12px' }}>
        <h3 style={{ margin: 0, fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Activité récente</h3>
        <button onClick={() => go('history')} style={{ background: 'none', border: 'none', color: p.brown, fontFamily: DISP, fontWeight: 600, fontSize: 13.5 }}>Tout voir</button>
      </div>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '4px 16px' }}>
        {TXNS.slice(0, 4).map((t, i) => <TxnRow key={t.id} t={t} p={p} last={i === 3} />)}
      </div>
      <div style={{ height: 8 }} />
    </div>
  )
}

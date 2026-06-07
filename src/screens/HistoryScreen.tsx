import { useState } from 'react'
import { Palette } from '../theme/palette'
import { TXNS, CAT_COLOR, Transaction } from '../data/mockData'
import { Icon } from '../components/ui/Icon'
import { Money } from '../components/ui/Money'

const DISP = '"Quicksand", system-ui, sans-serif'
const CATS = ['Tout', 'Cafétéria', 'Transport', 'Bibliothèque', 'Rechargement']

function TxnRow({ t, last, p }: { t: Transaction; last: boolean; p: Palette }) {
  const pos = t.amount > 0
  const zero = t.amount === 0
  const bg = CAT_COLOR[t.cat] ?? p.brown
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: last ? 'none' : `1px solid ${p.line2}` }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
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

export function HistoryScreen({ p }: { p: Palette }) {
  const [filter, setFilter] = useState('Tout')
  const list = TXNS.filter(t => filter === 'Tout' || t.cat === filter)
  const days = [...new Set(list.map(t => t.day))]
  const spentToday = TXNS.filter(t => t.day === "Aujourd'hui" && t.amount < 0).reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Historique</h2>
      <p style={{ margin: 0, color: p.muted, fontSize: 14 }}>
        Dépensé aujourd'hui · <b style={{ color: p.ink }}><Money value={-spentToday} /></b>
      </p>

      {/* filter pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '16px 0 6px', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              border: `1px solid ${filter === c ? 'transparent' : p.line}`,
              background: filter === c ? p.ink : p.surface,
              color: filter === c ? p.surface : p.ink2,
              fontFamily: DISP, fontWeight: 600, fontSize: 13.5, padding: '8px 15px',
              borderRadius: 999, whiteSpace: 'nowrap', transition: 'background .15s',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {days.map(d => (
        <div key={d}>
          <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>{d}</h3>
          <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '4px 16px' }}>
            {list.filter(t => t.day === d).map((t, i, a) => (
              <TxnRow key={t.id} t={t} p={p} last={i === a.length - 1} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  )
}

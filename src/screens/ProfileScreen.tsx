import { useState } from 'react'
import type { Palette } from '../theme/palette'
import { useStudent } from '../context/StudentContext'
import { studentInitials } from '../lib/db'
import { Icon } from '../components/ui/Icon'
import { Toggle } from '../components/ui/Toggle'

const DISP = '"Quicksand", system-ui, sans-serif'
const CARD_GRAD = 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)'

export function ProfileScreen({ p, onLogout }: { p: Palette; onLogout?: () => void }) {
  const { student } = useStudent()
  const [bio, setBio] = useState(true)
  const [contactless, setContactless] = useState(true)
  const [locked, setLocked] = useState(false)

  const rows = [
    { ic: 'lock',        label: 'Code PIN',                    detail: '••••' },
    { ic: 'fingerprint', label: 'Déverrouillage biométrique',  toggle: [bio, setBio] as [boolean, (v: boolean) => void] },
    { ic: 'nfc',         label: 'Paiement sans contact',       toggle: [contactless, setContactless] as [boolean, (v: boolean) => void] },
    { ic: 'bolt',        label: 'Plafond journalier',          detail: '25 000 F' },
  ]

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Profil</h2>

      {/* profile card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: CARD_GRAD, color: p.cardInk, display: 'grid', placeItems: 'center', fontFamily: DISP, fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
          {studentInitials(student)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>{student.name}</div>
          <div style={{ fontSize: 13, color: p.muted, marginTop: 2 }}>{student.promo}</div>
        </div>
        <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 12, color: p.brown, background: p.surfaceAlt, padding: '6px 11px', borderRadius: 999 }}>
          {student.id}
        </span>
      </div>

      {/* card status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: locked ? p.dangerSoft : p.okSoft, borderRadius: 16, padding: '13px 16px', marginTop: 12 }}>
        <Icon name={locked ? 'lock' : 'shieldOk'} size={22} color={locked ? p.danger : p.ok} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14.5, color: locked ? p.danger : p.ok }}>
            {locked ? 'Carte verrouillée' : 'Carte active & protégée'}
          </div>
          <div style={{ fontSize: 12.5, color: p.ink2 }}>
            {locked ? 'Aucune transaction autorisée' : 'Détection de fraude par IA activée'}
          </div>
        </div>
        <Toggle on={!locked} set={() => setLocked(!locked)} p={p} />
      </div>

      {/* security rows */}
      <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Sécurité</h3>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '4px 16px' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${p.line2}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: p.surfaceAlt, display: 'grid', placeItems: 'center' }}>
              <Icon name={r.ic} size={19} color={p.brown} />
            </span>
            <span style={{ flex: 1, fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink }}>{r.label}</span>
            {r.toggle ? (
              <Toggle on={r.toggle[0]} set={r.toggle[1]} p={p} />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: p.muted, fontSize: 14 }}>{r.detail}</span>
                <Icon name="chevR" size={17} color={p.muted} />
              </span>
            )}
          </div>
        ))}
      </div>

      <button style={{ width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'transparent', border: `1px solid ${p.dangerSoft}`, color: p.danger, borderRadius: 14, padding: '14px 0', fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>
        <Icon name="alert" size={18} color={p.danger} /> Signaler une perte ou un vol
      </button>
      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            width: '100%', marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: 'transparent', border: `1px solid ${p.line}`,
            color: p.muted, borderRadius: 14, padding: '14px 0',
            fontFamily: DISP, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          <Icon name="logout" size={18} color={p.muted} /> Se déconnecter
        </button>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

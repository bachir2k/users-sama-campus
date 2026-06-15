import { useState } from 'react'
import type { Palette } from '../theme/palette'
import { ACCESS_LOG } from '../data/mockData'
import { useStudent } from '../context/StudentContext'
import { Icon } from '../components/ui/Icon'
import { QRCode } from '../components/ui/QRCode'
import { Toggle } from '../components/ui/Toggle'

const DISP = '"Quicksand", system-ui, sans-serif'

export function AccessScreen({ p }: { p: Palette }) {
  const { student } = useStudent()
  const [nfc, setNfc] = useState(true)

  if (!student) return null

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Accès & badge</h2>
      <p style={{ margin: '0 0 16px', color: p.muted, fontSize: 14 }}>Identité numérique sécurisée du campus</p>

      {/* QR card */}
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 22, padding: 22, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 22px rgba(43,42,38,.12)' }}>
          <QRCode size={184} fg={p.ink} bg="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <span style={{ width: 9, height: 9, borderRadius: 5, background: p.ok, display: 'block' }} />
          <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14, color: p.ink }}>Badge actif · {student.id}</span>
        </div>
        <div style={{ color: p.muted, fontSize: 12.5, marginTop: 3 }}>Code régénéré toutes les 60 s</div>
      </div>

      {/* NFC toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 16px', marginTop: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: p.surfaceAlt, display: 'grid', placeItems: 'center' }}>
          <Icon name="nfc" size={22} color={p.brown} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink }}>Accès sans contact (NFC)</div>
          <div style={{ fontSize: 12.5, color: p.muted }}>Ouvrir les portes en approchant le téléphone</div>
        </div>
        <Toggle on={nfc} set={setNfc} p={p} />
      </div>

      {/* Access log */}
      <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Derniers accès</h3>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '4px 16px' }}>
        {ACCESS_LOG.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i === ACCESS_LOG.length - 1 ? 'none' : `1px solid ${p.line2}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: p.okSoft, display: 'grid', placeItems: 'center' }}>
              <Icon name="check" size={18} color={p.ok} strokeWidth={2.4} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 14.5, color: p.ink }}>{a.place}</div>
              <div style={{ fontSize: 12.5, color: p.muted }}>{a.when}</div>
            </div>
            <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 12.5, color: p.ok }}>Autorisé</span>
          </div>
        ))}
      </div>
      <div style={{ height: 8 }} />
    </div>
  )
}

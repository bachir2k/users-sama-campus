import { useState } from 'react'
import { Palette } from '../theme/palette'
import { Icon } from '../components/ui/Icon'
import { Money } from '../components/ui/Money'

const DISP = '"Quicksand", system-ui, sans-serif'

const PRESETS = [2000, 5000, 10000, 20000]
const METHODS = [
  { n: 'Orange Money', colorKey: 'brown' as const },
  { n: 'Wave',         colorKey: 'blue'  as const },
  { n: 'Free Money',   colorKey: 'olive' as const },
]

interface Props {
  p: Palette
  mode?: 'pay' | 'recharge'
}

export function PayScreen({ p, mode = 'pay' }: Props) {
  const [tab, setTab] = useState<'pay' | 'recharge'>(mode)
  const [amount, setAmount] = useState(mode === 'recharge' ? 10000 : 0)
  const [paid, setPaid] = useState(false)
  const [method, setMethod] = useState(0)

  const methodColor = (key: typeof METHODS[0]['colorKey']) =>
    ({ brown: p.brown, blue: p.blue, olive: p.olive }[key])

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Paiement</h2>

      {/* tab switcher */}
      <div style={{ display: 'flex', background: p.surfaceAlt, borderRadius: 13, padding: 4, marginBottom: 20 }}>
        {([['pay', 'Payer'], ['recharge', 'Recharger']] as ['pay' | 'recharge', string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => { setTab(k); setPaid(false) }}
            style={{
              flex: 1, border: 'none', borderRadius: 10, padding: '10px 0',
              fontFamily: DISP, fontWeight: 600, fontSize: 14.5,
              background: tab === k ? p.surface : 'transparent',
              color: tab === k ? p.ink : p.muted,
              boxShadow: tab === k ? '0 1px 4px rgba(43,42,38,.1)' : 'none',
              transition: 'background .15s',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'pay' ? (
        paid ? (
          /* success state */
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', background: p.okSoft, display: 'grid', placeItems: 'center', margin: '0 auto' }}>
              <Icon name="check" size={48} color={p.ok} strokeWidth={2.6} />
            </div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 21, color: p.ink, marginTop: 18 }}>Paiement validé</div>
            <div style={{ color: p.muted, fontSize: 14.5, marginTop: 4 }}>Cafétéria du campus · <Money value={1250} /></div>
            <button
              onClick={() => setPaid(false)}
              style={{ marginTop: 24, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 999, padding: '12px 22px', fontFamily: DISP, fontWeight: 600, fontSize: 14.5, color: p.ink }}
            >
              Nouveau paiement
            </button>
          </div>
        ) : (
          /* NFC tap prompt */
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 180, height: 180, margin: '10px auto 0', display: 'grid', placeItems: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px dashed ${p.line}` }} />
              <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', border: `1px solid ${p.line2}` }} />
              <Icon name="nfc" size={70} color={p.brown} strokeWidth={1.6} />
            </div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 19, color: p.ink, marginTop: 16 }}>Approchez votre carte</div>
            <div style={{ color: p.muted, fontSize: 14, marginTop: 4, maxWidth: 240, margin: '4px auto 0' }}>
              Présentez la carte ou le téléphone au terminal sans contact.
            </div>
            <button
              onClick={() => setPaid(true)}
              style={{ marginTop: 22, width: '100%', background: p.ink, color: p.surface, border: 'none', borderRadius: 14, padding: '15px 0', fontFamily: DISP, fontWeight: 700, fontSize: 15.5 }}
            >
              Simuler le paiement (1 250 F)
            </button>
          </div>
        )
      ) : (
        /* recharge form */
        <div>
          <div style={{ textAlign: 'center', background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '22px 0' }}>
            <div style={{ fontSize: 12.5, color: p.muted, fontWeight: 600, letterSpacing: '.04em' }}>MONTANT À RECHARGER</div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 40, color: p.ink, marginTop: 4 }}><Money value={amount} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {PRESETS.map(v => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                style={{
                  border: `1px solid ${amount === v ? p.brown : p.line}`,
                  background: amount === v ? p.surfaceAlt : p.surface,
                  color: p.ink, borderRadius: 13, padding: '14px 0',
                  fontFamily: DISP, fontWeight: 700, fontSize: 16,
                }}
              >
                <Money value={v} />
              </button>
            ))}
          </div>

          <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Moyen de paiement</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {METHODS.map((m, i) => (
              <button
                key={m.n}
                onClick={() => setMethod(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: p.surface, border: `1px solid ${method === i ? p.brown : p.line}`, borderRadius: 14, padding: '13px 15px' }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 9, background: methodColor(m.colorKey), display: 'grid', placeItems: 'center', color: '#fff', fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>
                  {m.n[0]}
                </span>
                <span style={{ flex: 1, textAlign: 'left', fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink }}>{m.n}</span>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${method === i ? p.brown : p.line}`, display: 'grid', placeItems: 'center' }}>
                  {method === i && <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.brown, display: 'block' }} />}
                </span>
              </button>
            ))}
          </div>

          <button style={{ marginTop: 20, width: '100%', background: p.ink, color: p.surface, border: 'none', borderRadius: 14, padding: '15px 0', fontFamily: DISP, fontWeight: 700, fontSize: 15.5 }}>
            Confirmer le rechargement
          </button>
        </div>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

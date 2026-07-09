import { useState, useEffect } from 'react'
import type { Palette } from '../theme/palette'
import { Icon } from '../components/ui/Icon'
import { Money } from '../components/ui/Money'
import { supabase } from '../lib/supabase'
import { useStudent } from '../context/StudentContext'

const DISP = '"Quicksand", system-ui, sans-serif'
const PENDING_TOKEN_KEY = 'sc_pending_payment_token'

const PRESETS = [2000, 5000, 10000, 20000]
const METHODS = [
  { n: 'Orange Money', colorKey: 'brown' as const },
  { n: 'Wave',         colorKey: 'blue'  as const },
  { n: 'Free Money',   colorKey: 'olive' as const },
]

async function extractErrorMessage(error: unknown): Promise<string> {
  let detail = error instanceof Error ? error.message : 'Erreur inconnue'
  try {
    const body = await (error as any)?.context?.json?.()
    if (body?.error) detail = body.error
    else if (body?.message) detail = body.message
  } catch { /* ignore */ }
  return detail
}

interface Props {
  p: Palette
}

export function PayScreen({ p }: Props) {
  const { refetch } = useStudent()
  const [amount, setAmount] = useState(10000)
  const [customMode, setCustomMode] = useState(false)
  const [paid, setPaid]     = useState(false)
  const [method, setMethod] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Détecter le retour depuis PayDunya (?status=success ou ?status=cancel). On confirme
  // activement le paiement avec le token stocké dans sessionStorage juste avant la
  // redirection (handleRecharge) plutôt que d'attendre le webhook (pas fiable en
  // sandbox). PayDunya ajoute parfois un "/" parasite avant le paramètre suivant
  // (ex: "?status=success/&token=..."), d'où le nettoyage.
  const urlStatus = new URLSearchParams(window.location.search).get('status')?.replace(/\/$/, '')

  useEffect(() => {
    if (urlStatus !== 'success') return
    window.history.replaceState({}, '', window.location.pathname)
    const pendingToken = sessionStorage.getItem(PENDING_TOKEN_KEY)
    if (!pendingToken) return
    sessionStorage.removeItem(PENDING_TOKEN_KEY)

    setLoading(true)
    setErrorMsg('')
    supabase.functions.invoke('payment-confirm', { body: { token: pendingToken } })
      .then(async ({ data, error }) => {
        if (error) throw new Error(await extractErrorMessage(error))
        if (!data?.credited) throw new Error(data?.error || 'Paiement non confirmé')
        setAmount(data.amount)
        setPaid(true)
        refetch()
      })
      .catch((e: Error) => setErrorMsg(e.message))
      .finally(() => setLoading(false))
  }, [urlStatus])

  const methodColor = (key: typeof METHODS[0]['colorKey']) =>
    ({ brown: p.brown, blue: p.blue, olive: p.olive }[key])

  async function handleRecharge() {
    if (amount < 100) return
    setLoading(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('payment-init', {
        body: { amount, type: 'recharge' },
      })

      if (error) {
        const detail = await extractErrorMessage(error)
        console.error('[payment-init] error:', detail)
        throw new Error(detail)
      }

      if (data?.redirectUrl) {
        if (data.token) sessionStorage.setItem(PENDING_TOKEN_KEY, data.token)
        window.location.href = data.redirectUrl
      } else {
        console.error('[payment-init] no redirectUrl in response:', data)
        throw new Error('URL de redirection manquante')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur lors du paiement')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Recharger</h2>

      {paid ? (
        /* succès rechargement */
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: p.okSoft, display: 'grid', placeItems: 'center', margin: '0 auto' }}>
            <Icon name="check" size={48} color={p.ok} strokeWidth={2.6} />
          </div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 21, color: p.ink, marginTop: 18 }}>Rechargement effectué</div>
          <div style={{ color: p.muted, fontSize: 14.5, marginTop: 4 }}>
            <Money value={amount} /> ajoutés à votre solde
          </div>
          <button
            onClick={() => { setPaid(false); setAmount(10000); setCustomMode(false) }}
            style={{ marginTop: 24, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 999, padding: '12px 22px', fontFamily: DISP, fontWeight: 600, fontSize: 14.5, color: p.ink }}
          >
            Nouveau rechargement
          </button>
        </div>
      ) : (
        <div>
            <div style={{ textAlign: 'center', background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '22px 0' }}>
              <div style={{ fontSize: 12.5, color: p.muted, fontWeight: 600, letterSpacing: '.04em' }}>MONTANT À RECHARGER</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 40, color: p.ink, marginTop: 4 }}><Money value={amount} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              {PRESETS.map(v => (
                <button
                  key={v}
                  onClick={() => { setAmount(v); setCustomMode(false) }}
                  style={{
                    border: `1px solid ${!customMode && amount === v ? p.brown : p.line}`,
                    background: !customMode && amount === v ? p.surfaceAlt : p.surface,
                    color: p.ink, borderRadius: 13, padding: '14px 0',
                    fontFamily: DISP, fontWeight: 700, fontSize: 16,
                  }}
                >
                  <Money value={v} />
                </button>
              ))}

              {customMode ? (
                <input
                  type="number"
                  autoFocus
                  min={100}
                  placeholder="Autre montant (F)"
                  value={amount || ''}
                  onChange={e => setAmount(Math.max(0, Math.round(Number(e.target.value))))}
                  onWheel={e => (e.target as HTMLInputElement).blur()}
                  style={{
                    gridColumn: '1 / -1',
                    border: `1px solid ${p.brown}`,
                    background: p.surface,
                    color: p.ink, borderRadius: 13, padding: '13px 16px',
                    fontFamily: DISP, fontWeight: 700, fontSize: 16,
                    textAlign: 'center', width: '100%', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              ) : (
                <button
                  onClick={() => { setCustomMode(true); setAmount(0) }}
                  style={{
                    gridColumn: '1 / -1',
                    border: `1px dashed ${p.line}`,
                    background: p.surface,
                    color: p.muted, borderRadius: 13, padding: '13px 0',
                    fontFamily: DISP, fontWeight: 600, fontSize: 14.5,
                  }}
                >
                  Autre montant…
                </button>
              )}
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

            {errorMsg && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: p.dangerSoft, borderRadius: 12, color: p.danger, fontFamily: DISP, fontWeight: 600, fontSize: 14 }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleRecharge}
              disabled={loading || amount < 100}
              style={{
                marginTop: 20, width: '100%', border: 'none', borderRadius: 14,
                padding: '15px 0', fontFamily: DISP, fontWeight: 700, fontSize: 15.5,
                background: loading || amount < 100 ? p.muted : p.ink,
                color: p.surface, cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${p.surface}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  Redirection vers PayDunya…
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </>
              ) : (
                <>Confirmer le rechargement · <Money value={amount} /></>
              )}
            </button>
          </div>
        )}
      <div style={{ height: 8 }} />
    </div>
  )
}

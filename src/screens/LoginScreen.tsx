import { useState, type FormEvent, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import type { Palette } from '../theme/palette'

const DISP = '"Quicksand", system-ui, sans-serif'
const BODY = '"Mulish", system-ui, sans-serif'

interface Props {
  p: Palette
  onLogin: () => void
}

export function LoginScreen({ p, onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
      else onLogin()
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setInfo('Compte créé. Vérifiez votre email ou connectez-vous directement.')
    }

    setLoading(false)
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${p.line}`,
    background: p.appBg,
    fontFamily: BODY,
    fontSize: 14.5,
    color: p.ink,
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: p.appBg,
      fontFamily: BODY,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: p.ink,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <div style={{
              width: 22, height: 14, borderRadius: 3,
              background: 'linear-gradient(135deg,#D7B477,#8B6B4A)',
            }} />
          </div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>
            Sama<span style={{ color: p.brown }}>Campus</span>
          </div>
          <div style={{ fontSize: 13.5, color: p.muted, fontWeight: 600, marginTop: 4 }}>
            Espace étudiant
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: p.surface,
          border: `1px solid ${p.line}`,
          borderRadius: 22,
          padding: 32,
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: DISP,
            fontWeight: 700,
            fontSize: 20,
            color: p.ink,
          }}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: p.muted,
                display: 'block',
                marginBottom: 7,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="etudiant@campus.sn"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: p.muted,
                display: 'block',
                marginBottom: 7,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                background: p.dangerSoft,
                color: p.danger,
                padding: '11px 14px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
              }}>
                {error}
              </div>
            )}
            {info && (
              <div style={{
                background: p.okSoft,
                color: p.ok,
                padding: '11px 14px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
              }}>
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: loading ? p.muted : p.brown,
                color: '#fff',
                fontFamily: DISP,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: p.muted }}>
            {mode === 'login' ? (
              <>Pas encore de compte ?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  style={{
                    background: 'none', border: 'none',
                    color: p.brown, fontFamily: DISP,
                    fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                  }}
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>Déjà un compte ?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setInfo('') }}
                  style={{
                    background: 'none', border: 'none',
                    color: p.brown, fontFamily: DISP,
                    fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                  }}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

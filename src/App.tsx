import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { scPalette, type Variant } from './theme/palette'
import { HomeScreen } from './screens/HomeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { PayScreen } from './screens/PayScreen'
import { PresencesScreen } from './screens/PresencesScreen'
import { BookLoansScreen } from './screens/BookLoansScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { LoginScreen } from './screens/LoginScreen'
import { Icon } from './components/ui/Icon'
import { StudentProvider, useStudent } from './context/StudentContext'
import { studentInitials } from './lib/db'
import { supabase } from './lib/supabase'

type Screen = 'home' | 'history' | 'pay' | 'pay-pay' | 'pay-recharge' | 'presences' | 'loans' | 'profile'

const VARIANT: Variant = 'light'

const NAV = [
  { key: 'home' as Screen,      ic: 'home',     label: 'Carte' },
  { key: 'history' as Screen,   ic: 'history',  label: 'Activité' },
  { key: 'pay' as Screen,       ic: 'pay',      label: 'Payer' },
  { key: 'presences' as Screen, ic: 'calendar', label: 'Présences' },
  { key: 'loans' as Screen,     ic: 'book',     label: 'Emprunts' },
  { key: 'profile' as Screen,   ic: 'user',     label: 'Profil' },
]

const DISP = '"Quicksand", system-ui, sans-serif'

export default function App() {
  const p = scPalette(VARIANT)
  // PayDunya ajoute parfois un "/" parasite avant le paramètre suivant
  // (ex: "?status=success/&token=..."), d'où le nettoyage.
  const urlStatus = new URLSearchParams(window.location.search).get('status')?.replace(/\/$/, '')
  const [screen, setScreen] = useState<Screen>(
    urlStatus === 'success' || urlStatus === 'cancel' ? 'pay-recharge' : 'home'
  )
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    // Le cas "success" est nettoyé par PayScreen une fois le paiement traité
    // (sinon l'URL est effacée avant même que PayScreen ait eu le temps de la lire,
    // vu qu'il ne monte qu'après le chargement async de la session/du profil).
    if (urlStatus === 'cancel') window.history.replaceState({}, '', window.location.pathname)
  }, [urlStatus])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authed === null) {
    return (
      <div style={{ minHeight: '100dvh', background: p.appBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${p.line}`, borderTopColor: p.brown, animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!authed) {
    return <LoginScreen p={p} onLogin={() => setAuthed(true)} />
  }

  return (
    <StudentProvider>
      <AuthenticatedApp p={p} screen={screen} setScreen={setScreen} />
    </StudentProvider>
  )
}

function AuthenticatedApp({ p, screen, setScreen }: {
  p: ReturnType<typeof scPalette>
  screen: Screen
  setScreen: (s: Screen) => void
}) {
  const { student, loading, error } = useStudent()
  const go = (s: string) => setScreen(s as Screen)
  const logout = () => supabase.auth.signOut()

  // Uniquement au tout premier chargement (pas de student encore) — un refetch()
  // ultérieur (ex: après un rechargement) ne doit pas remonter tout l'écran et
  // perdre l'état local des composants enfants (ex: l'écran "Rechargement effectué").
  if (loading && !student) {
    return (
      <div style={{ minHeight: '100dvh', background: p.appBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${p.line}`, borderTopColor: p.brown, animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div style={{ minHeight: '100dvh', background: p.appBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 400, textAlign: 'center', background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: 32 }}>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.danger, marginBottom: 10 }}>Profil introuvable</div>
          <p style={{ margin: '0 0 20px', color: p.muted, fontSize: 14, lineHeight: 1.5 }}>{error || 'Aucun profil étudiant associé à ce compte.'}</p>
          <button onClick={logout} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: p.ink, color: p.surface, fontFamily: DISP, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  const baseTab: Screen = screen.startsWith('pay') ? 'pay' : screen

  let content: ReactNode
  switch (screen) {
    case 'home':         content = <HomeScreen p={p} go={go} />; break
    case 'history':      content = <HistoryScreen p={p} />; break
    case 'pay':
    case 'pay-pay':      content = <PayScreen p={p} mode="pay" />; break
    case 'pay-recharge': content = <PayScreen p={p} mode="recharge" />; break
    case 'presences':    content = <PresencesScreen p={p} />; break
    case 'loans':        content = <BookLoansScreen p={p} />; break
    case 'profile':      content = <ProfileScreen p={p} onLogout={logout} />; break
    default:             content = <HomeScreen p={p} go={go} />
  }

  const sidebar: CSSProperties = {
    width: 264,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: p.surface,
    borderRight: `1px solid ${p.line}`,
    padding: '28px 18px',
    position: 'sticky',
    top: 0,
    height: '100dvh',
  }

  const main: CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: '100dvh',
    background: p.appBg,
    color: p.ink,
    fontFamily: '"Mulish", system-ui, sans-serif',
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <aside style={sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 28px' }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, background: p.ink, display: 'grid', placeItems: 'center' }}>
            <Icon name="card" size={18} color={p.surface} strokeWidth={2} />
          </span>
          <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 19, color: p.ink }}>
            Sama<span style={{ color: p.brown }}>Campus</span>
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(n => {
            const active = baseTab === n.key
            return (
              <button
                key={n.key}
                onClick={() => go(n.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13,
                  padding: '12px 14px', borderRadius: 13,
                  background: active ? p.surfaceAlt : 'transparent',
                  color: active ? p.brown : p.ink2,
                  fontFamily: DISP, fontWeight: active ? 700 : 600, fontSize: 14.5,
                  textAlign: 'left', width: '100%',
                }}
              >
                <Icon name={n.ic} size={20} color={active ? p.brown : p.muted} strokeWidth={active ? 2.2 : 1.8} />
                {n.label}
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => go('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 12, borderRadius: 14, marginTop: 12,
            background: p.surfaceAlt, border: `1px solid ${p.line}`,
            textAlign: 'left', width: '100%',
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)',
            color: p.cardInk, display: 'grid', placeItems: 'center',
            fontFamily: DISP, fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {studentInitials(student)}
          </span>
          <span style={{ minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
            <div style={{ fontSize: 12, color: p.muted }}>{student.id}</div>
          </span>
        </button>
      </aside>

      <main style={main}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 48px 64px' }}>
          {content}
        </div>
      </main>
    </div>
  )
}

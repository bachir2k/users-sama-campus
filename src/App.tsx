import React, { useState, CSSProperties } from 'react'
import { scPalette, Variant } from './theme/palette'
import { HomeScreen } from './screens/HomeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { PayScreen } from './screens/PayScreen'
import { AccessScreen } from './screens/AccessScreen'
import { PresencesScreen } from './screens/PresencesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { Icon } from './components/ui/Icon'

type Screen = 'home' | 'history' | 'pay' | 'pay-pay' | 'pay-recharge' | 'access' | 'presences' | 'profile'

const VARIANT: Variant = 'light'

const TABS = [
  { key: 'home' as Screen,    ic: 'home',    label: 'Carte' },
  { key: 'history' as Screen, ic: 'history', label: 'Activité' },
  { key: 'pay' as Screen,     ic: 'pay',     label: 'Payer',   center: true },
  { key: 'access' as Screen,  ic: 'qr',      label: 'Accès' },
  { key: 'profile' as Screen, ic: 'user',    label: 'Profil' },
]

const DISP = '"Quicksand", system-ui, sans-serif'

export default function App() {
  const p = scPalette(VARIANT)
  const [screen, setScreen] = useState<Screen>('home')

  const go = (s: string) => setScreen(s as Screen)

  const baseTab: Screen | null = screen.startsWith('pay')
    ? 'pay'
    : screen === 'presences'
    ? null
    : screen as Screen

  const showBack = screen === 'presences'

  let content: React.ReactNode
  switch (screen) {
    case 'home':         content = <HomeScreen p={p} go={go} />; break
    case 'history':      content = <HistoryScreen p={p} />; break
    case 'pay':
    case 'pay-pay':      content = <PayScreen p={p} mode="pay" />; break
    case 'pay-recharge': content = <PayScreen p={p} mode="recharge" />; break
    case 'access':       content = <AccessScreen p={p} />; break
    case 'presences':    content = <PresencesScreen p={p} />; break
    case 'profile':      content = <ProfileScreen p={p} />; break
    default:             content = <HomeScreen p={p} go={go} />
  }

  const shell: CSSProperties = {
    width: '100%',
    maxWidth: 430,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: p.appBg,
    position: 'relative',
    boxShadow: '0 0 60px rgba(0,0,0,0.12)',
    fontFamily: '"Mulish", system-ui, sans-serif',
    color: p.ink,
  }

  const tabBar: CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 10px max(26px, env(safe-area-inset-bottom))',
    background: p.tabBg,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: `1px solid ${p.line}`,
    position: 'sticky',
    bottom: 0,
  }

  return (
    <div style={shell}>
      {/* safe area top */}
      <div style={{ height: 'max(20px, env(safe-area-inset-top))', flexShrink: 0, background: p.appBg }} />

      {/* back button for sub-screens */}
      {showBack && (
        <div style={{ padding: '0 20px 6px', flexShrink: 0 }}>
          <button
            onClick={() => go('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.brown, fontFamily: DISP, fontWeight: 600, fontSize: 14.5 }}
          >
            <Icon name="chevL" size={18} color={p.brown} /> Accueil
          </button>
        </div>
      )}

      {/* scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 20px 16px' }}>
        {content}
      </div>

      {/* tab bar */}
      <div style={tabBar}>
        {TABS.map(t => {
          const active = baseTab === t.key
          if (t.center) {
            return (
              <button
                key={t.key}
                onClick={() => go('pay')}
                style={{
                  background: p.ink, border: 'none', width: 52, height: 52,
                  borderRadius: 17, display: 'grid', placeItems: 'center',
                  marginTop: -18, boxShadow: '0 8px 18px rgba(43,42,38,.28)', flexShrink: 0,
                }}
              >
                <Icon name="pay" size={24} color={p.surface} strokeWidth={2} />
              </button>
            )
          }
          return (
            <button
              key={t.key}
              onClick={() => go(t.key)}
              style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 8px', flex: 1 }}
            >
              <Icon name={t.ic} size={23} color={active ? p.brown : p.muted} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 10.5, color: active ? p.brown : p.muted }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

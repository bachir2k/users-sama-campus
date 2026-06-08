import React, { useState, CSSProperties } from 'react'
import { scPalette, Variant } from './theme/palette'
import { HomeScreen } from './screens/HomeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { PayScreen } from './screens/PayScreen'
import { AccessScreen } from './screens/AccessScreen'
import { PresencesScreen } from './screens/PresencesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { Icon } from './components/ui/Icon'
import { STUDENT } from './data/mockData'

type Screen = 'home' | 'history' | 'pay' | 'pay-pay' | 'pay-recharge' | 'access' | 'presences' | 'profile'

const VARIANT: Variant = 'light'

const NAV = [
  { key: 'home' as Screen,      ic: 'home',     label: 'Carte' },
  { key: 'history' as Screen,   ic: 'history',  label: 'Activité' },
  { key: 'pay' as Screen,       ic: 'pay',      label: 'Payer' },
  { key: 'access' as Screen,    ic: 'qr',       label: 'Accès' },
  { key: 'presences' as Screen, ic: 'calendar', label: 'Présences' },
  { key: 'profile' as Screen,   ic: 'user',     label: 'Profil' },
]

const DISP = '"Quicksand", system-ui, sans-serif'

export default function App() {
  const p = scPalette(VARIANT)
  const [screen, setScreen] = useState<Screen>('home')

  const go = (s: string) => setScreen(s as Screen)

  const baseTab: Screen = screen.startsWith('pay') ? 'pay' : (screen as Screen)

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
      {/* sidebar */}
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
            {STUDENT.first[0]}{STUDENT.name.split(' ')[1]?.[0] ?? ''}
          </span>
          <span style={{ minWidth: 0 }}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{STUDENT.name}</div>
            <div style={{ fontSize: 12, color: p.muted }}>{STUDENT.id}</div>
          </span>
        </button>
      </aside>

      {/* main content */}
      <main style={main}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 48px 64px' }}>
          {content}
        </div>
      </main>
    </div>
  )
}

import { Palette } from '../theme/palette'
import { SCHEDULE } from '../data/mockData'
import { Icon } from '../components/ui/Icon'

const DISP = '"Quicksand", system-ui, sans-serif'
const CARD_GRAD = 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)'

const WEEK: [string, number, boolean][] = [
  ['L', 28, true], ['M', 29, true], ['M', 30, true],
  ['J', 31, true], ['V', 1,  false], ['S', 2, false], ['D', 3, false],
]
const TODAY = 1

export function PresencesScreen({ p }: { p: Palette }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 14px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Présences</h2>

      {/* stat cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: CARD_GRAD, color: p.cardInk, borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, opacity: .8, fontWeight: 600 }}>Taux de présence</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30 }}>94%</div>
          <div style={{ fontSize: 12, opacity: .8 }}>ce semestre</div>
        </div>
        <div style={{ flex: 1, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>Cours suivis</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30, color: p.ink }}>
            2<span style={{ fontSize: 18, color: p.muted }}>/4</span>
          </div>
          <div style={{ fontSize: 12, color: p.muted }}>aujourd'hui</div>
        </div>
      </div>

      {/* week strip */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'space-between' }}>
        {WEEK.map(([d, n, done], i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', borderRadius: 13, padding: '10px 0', background: n === TODAY ? p.ink : p.surface, border: `1px solid ${n === TODAY ? 'transparent' : p.line}` }}>
            <div style={{ fontSize: 11, color: n === TODAY ? 'rgba(255,255,255,.7)' : p.muted, fontWeight: 600 }}>{d}</div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, color: n === TODAY ? '#fff' : p.ink, marginTop: 2 }}>{n}</div>
            <div style={{ width: 5, height: 5, borderRadius: 3, margin: '5px auto 0', background: done ? (n === TODAY ? p.goldSoft : p.ok) : 'transparent' }} />
          </div>
        ))}
      </div>

      <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>Aujourd'hui · Vendredi 1 juin</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCHEDULE.map((s, i) => {
          const present = s.status === 'present'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ textAlign: 'center', minWidth: 42 }}>
                <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, color: p.ink }}>{s.time}</div>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: p.line2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, color: p.ink }}>{s.course}</div>
                <div style={{ fontSize: 12.5, color: p.muted }}>{s.room}</div>
              </div>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: DISP, fontWeight: 600, fontSize: 12.5,
                color: present ? p.ok : p.muted,
                background: present ? p.okSoft : p.surfaceAlt,
                padding: '6px 11px', borderRadius: 999,
              }}>
                {present
                  ? <Icon name="check" size={14} color={p.ok} strokeWidth={2.6} />
                  : <Icon name="clock" size={14} color={p.muted} />}
                {present ? 'Présent' : 'À venir'}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ height: 8 }} />
    </div>
  )
}

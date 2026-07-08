import { useState } from 'react'
import type { Palette } from '../theme/palette'
import { usePresences, dayKey, formatDayLabel } from '../lib/presences'
import { Icon } from '../components/ui/Icon'

const DISP = '"Quicksand", system-ui, sans-serif'
const CARD_GRAD = 'radial-gradient(130% 130% at 12% 8%, #9a7850 0%, #7d5f3f 46%, #5f4730 100%)'

export function PresencesScreen({ p }: { p: Palette }) {
  const { data, loading, error } = usePresences()
  const [selected, setSelected] = useState<Date>(() => new Date())

  const selectedKey = dayKey(selected)
  const todayKey = dayKey(new Date())
  const isSelectedToday = selectedKey === todayKey

  const selectedEntries = (data?.entries || [])
    .filter(e => dayKey(e.date) === selectedKey)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div>
      <h2 style={{ margin: '0 0 14px', fontFamily: DISP, fontWeight: 700, fontSize: 26, color: p.ink }}>Présences</h2>

      {loading && <div style={{ color: p.muted, fontSize: 14 }}>Chargement…</div>}
      {!loading && error && <div style={{ color: p.muted, fontSize: 14 }}>{error}</div>}

      {!loading && !error && data && (
        <>
          {/* stat cards */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: CARD_GRAD, color: p.cardInk, borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, opacity: .8, fontWeight: 600 }}>Taux de présence</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30 }}>{data.attendanceRate}%</div>
              <div style={{ fontSize: 12, opacity: .8 }}>ce semestre</div>
            </div>
            <div style={{ flex: 1, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>Cours suivis</div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 30, color: p.ink }}>
                {data.todayPresentCount}<span style={{ fontSize: 18, color: p.muted }}>/{data.todayTotalCount}</span>
              </div>
              <div style={{ fontSize: 12, color: p.muted }}>aujourd'hui</div>
            </div>
          </div>

          {/* week strip */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'space-between' }}>
            {data.week.map((d, i) => {
              const isSelected = dayKey(d.date) === selectedKey
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d.date)}
                  style={{
                    flex: 1, textAlign: 'center', borderRadius: 13, padding: '10px 0',
                    background: isSelected ? p.ink : p.surface,
                    border: `1px solid ${isSelected ? 'transparent' : p.line}`,
                    cursor: 'pointer', font: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 11, color: isSelected ? 'rgba(255,255,255,.7)' : p.muted, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, color: isSelected ? '#fff' : p.ink, marginTop: 2 }}>{d.num}</div>
                  <div style={{ width: 5, height: 5, borderRadius: 3, margin: '5px auto 0', background: d.hasRecord ? (isSelected ? p.goldSoft : (d.done ? p.ok : p.line2)) : 'transparent' }} />
                </button>
              )
            })}
          </div>

          <h3 style={{ margin: '24px 0 12px', fontFamily: DISP, fontWeight: 700, fontSize: 18, color: p.ink }}>
            {isSelectedToday ? "Aujourd'hui · " : ''}{formatDayLabel(selected)}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedEntries.length === 0 && (
              <div style={{ color: p.muted, fontSize: 14 }}>Aucun pointage ce jour-là.</div>
            )}
            {selectedEntries.map((s) => {
              const present = s.status === 'present'
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: p.surface, border: `1px solid ${p.line}`, borderRadius: 16, padding: '14px 16px' }}>
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
                    color: present ? p.ok : p.danger,
                    background: present ? p.okSoft : p.dangerSoft,
                    padding: '6px 11px', borderRadius: 999,
                  }}>
                    {present
                      ? <Icon name="check" size={14} color={p.ok} strokeWidth={2.6} />
                      : <Icon name="x" size={14} color={p.danger} strokeWidth={2.6} />}
                    {present ? 'Présent' : 'Absent'}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
      <div style={{ height: 8 }} />
    </div>
  )
}

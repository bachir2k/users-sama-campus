import { Palette } from '../../theme/palette'

interface ToggleProps {
  on: boolean
  set: (v: boolean) => void
  p: Palette
}

export function Toggle({ on, set, p }: ToggleProps) {
  return (
    <button
      onClick={() => set(!on)}
      role="switch"
      aria-checked={on}
      style={{
        width: 46, height: 28, borderRadius: 999, border: 'none',
        background: on ? p.ok : p.line, position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.3)', display: 'block',
      }} />
    </button>
  )
}

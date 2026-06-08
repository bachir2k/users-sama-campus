import { CSSProperties } from 'react'

const ICONS: Record<string, string> = {
  card:        'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4',
  history:     'M3 3v6h6M3 9a9 9 0 1 1-1 4M12 7v5l3 2',
  pay:         'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M16 15h3',
  plus:        'M12 5v14M5 12h14',
  qr:          'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  nfc:         'M5 12a14 14 0 0 1 14 0M7.5 15a9 9 0 0 1 9 0M10 18a4 4 0 0 1 4 0',
  calendar:    'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M8 2v4M16 2v4',
  user:        'M4 21a8 8 0 0 1 16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  home:        'M3 11l9-7 9 7M5 10v10h14V10',
  bolt:        'M13 2L4 14h7l-1 8 9-12h-7z',
  shield:      'M12 2l8 4v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V6z',
  shieldOk:   'M12 2l8 4v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V6zM9 12l2 2 4-4',
  bell:        'M6 9a6 6 0 0 1 12 0c0 7 2 8 2 8H4s2-1 2-8M10 20a2 2 0 0 0 4 0',
  search:      'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  bus:         'M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M3 16h18M3 11h18M7 20v-2M17 20v-2M7 16v.01M17 16v.01',
  book:        'M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 1 2 2z',
  fork:        'M5 3v8a3 3 0 0 0 6 0V3M8 3v18M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5zM16 12v9',
  check:       'M4 12l5 5L20 6',
  checkCircle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 12l3 3 5-5',
  x:           'M6 6l12 12M18 6L6 18',
  chevR:       'M9 6l6 6-6 6',
  chevL:       'M15 6l-6 6 6 6',
  chevD:       'M6 9l6 6 6-6',
  arrowUp:     'M12 19V5M6 11l6-6 6 6',
  arrowDown:   'M12 5v14M6 13l6 6 6-6',
  lock:        'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
  fingerprint: 'M12 11v3a6 6 0 0 0 1 3M8 7a6 6 0 0 1 9 5v2M5 12a7 7 0 0 1 3-6M12 7a4 4 0 0 1 4 4v4',
  settings:    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z',
  chart:       'M4 20V10M10 20V4M16 20v-7M22 20H2',
  clock:       'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v5l3 2',
  trend:       'M3 17l6-6 4 4 7-8M14 7h6v6',
  alert:       'M12 3l9 16H3zM12 10v4M12 17v.01',
  filter:      'M3 5h18l-7 8v6l-4-2v-4z',
  dots:        'M5 12h.01M12 12h.01M19 12h.01',
  logout:      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  fill?: string
  style?: CSSProperties
}

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.9, fill = 'none', style }: IconProps) {
  const d = ICONS[name] ?? ''
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  )
}

interface QRCodeProps {
  size?: number
  fg?: string
  bg?: string
}

export function QRCode({ size = 188, fg = '#2B2A26', bg = '#fff' }: QRCodeProps) {
  const N = 25
  const cell = size / N
  const cells: React.ReactNode[] = []
  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7)

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c)) continue
      if (rnd() > 0.52) {
        cells.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={fg} />)
      }
    }
  }

  const finder = (ox: number, oy: number) => (
    <g key={`${ox}-${oy}`}>
      <rect x={ox} y={oy} width={cell * 7} height={cell * 7} fill={fg} />
      <rect x={ox + cell} y={oy + cell} width={cell * 5} height={cell * 5} fill={bg} />
      <rect x={ox + cell * 2} y={oy + cell * 2} width={cell * 3} height={cell * 3} fill={fg} />
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect x="0" y="0" width={size} height={size} fill={bg} />
      {cells}
      {finder(0, 0)}
      {finder((N - 7) * cell, 0)}
      {finder(0, (N - 7) * cell)}
    </svg>
  )
}

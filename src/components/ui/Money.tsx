import { CSSProperties } from 'react'

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

interface MoneyProps {
  value: number
  suffix?: string
  sign?: boolean
  style?: CSSProperties
}

export function Money({ value, suffix = ' F', sign = false, style }: MoneyProps) {
  const text = (sign && value > 0 ? '+' : '') + fmtMoney(value) + suffix
  return <span style={style}>{text}</span>
}

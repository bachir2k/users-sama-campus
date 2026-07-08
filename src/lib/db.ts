import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type { Transaction } from '../data/mockData'

const ICON_MAP: Record<string, string> = {
  Cafétéria: 'fork', Transport: 'bus', Bibliothèque: 'book',
  Rechargement: 'plus', Accès: 'home', Parking: 'home',
}

export interface StudentProfile {
  dbId: string
  name: string
  first: string
  id: string
  promo: string
  class?: string
  balance: number
  num: string
  email?: string
  phone?: string
}

function mapStudent(row: Record<string, unknown>): StudentProfile {
  const cards = row.cards as Record<string, unknown> | Record<string, unknown>[] | null
  const card = Array.isArray(cards) ? cards[0] : cards
  const fullName = (row.full_name as string) || ''
  return {
    dbId: row.id as string,
    name: fullName,
    first: (row.first_name as string) || fullName.split(' ')[0] || '',
    id: (row.student_number as string) || '—',
    promo: (row.promo as string) || (row.class as string) || '—',
    class: (row.class as string) || undefined,
    balance: (card?.balance as number) ?? 0,
    num: (card?.card_number as string) || '—',
    email: (row.email as string) || undefined,
    phone: (row.phone as string) || undefined,
  }
}

function formatDay(ts: string): string {
  const d = new Date(ts)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  const diff = (today.getTime() - day.getTime()) / 86400000
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7) return 'Cette semaine'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
}

function formatWhen(ts: string): string {
  const day = formatDay(ts)
  const time = new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (day === "Aujourd'hui" || day === 'Hier') return `${day} · ${time}`
  return `${new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })} · ${time}`
}

function mapTransaction(t: Record<string, unknown>, i: number): Transaction {
  const svc = (t.service as string) || 'Autre'
  return {
    id: i,
    cat: svc,
    icon: ICON_MAP[svc] || 'card',
    label: (t.description as string) || svc,
    amount: t.amount as number,
    when: formatWhen(t.created_at as string),
    day: formatDay(t.created_at as string),
  }
}

export function studentInitials(student: StudentProfile): string {
  const parts = student.name.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${student.first[0] || parts[0][0]}${parts[parts.length - 1][0]}`
  return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

async function fetchStudentRow(email?: string | null, studentNumber?: string) {
  const select = '*, cards(card_number, status, balance)'

  if (email) {
    const { data } = await supabase.from('students').select(select).eq('email', email).maybeSingle()
    if (data) return data
  }
  if (studentNumber) {
    const { data } = await supabase.from('students').select(select).eq('student_number', studentNumber).maybeSingle()
    if (data) return data
  }
  return null
}

export function useStudentSession() {
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) {
          setStudent(null)
          setTransactions([])
          setLoading(false)
        }
        return
      }

      const row = await fetchStudentRow(
        session.user.email,
        session.user.user_metadata?.student_number as string | undefined,
      )

      if (!row) {
        if (!cancelled) {
          setError('Profil étudiant introuvable. Contactez l\'administration.')
          setStudent(null)
          setTransactions([])
          setLoading(false)
        }
        return
      }

      const profile = mapStudent(row)

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', profile.dbId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!cancelled) {
        setStudent(profile)
        setTransactions((txns || []).map(mapTransaction))
        setLoading(false)
      }
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [tick])

  return { student, transactions, loading, error, refetch }
}

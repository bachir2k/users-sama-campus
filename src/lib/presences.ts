import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useStudent } from '../context/StudentContext'

export type PresenceStatus = 'present' | 'absent'

export interface AttendanceEntry {
  id: string
  time: string
  course: string
  room: string
  date: Date
  status: PresenceStatus
}

export interface WeekDay {
  label: string
  num: number
  date: Date
  hasRecord: boolean
  done: boolean
  isToday: boolean
}

interface PresencesData {
  entries: AttendanceEntry[]
  today: AttendanceEntry[]
  todayLabel: string
  week: WeekDay[]
  attendanceRate: number
  todayPresentCount: number
  todayTotalCount: number
}

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S']

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function startOfWeek(d: Date): Date {
  const s = new Date(d)
  const dow = (s.getDay() + 6) % 7 // 0 = Monday
  s.setDate(s.getDate() - dow)
  s.setHours(0, 0, 0, 0)
  return s
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDayLabel(d: Date): string {
  return capitalize(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
}

export function usePresences() {
  const { student } = useStudent()
  const [data, setData] = useState<PresencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!student) {
        setData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data: rows, error: err } = await supabase
        .from('attendance')
        .select('id,status,recorded_at,courses(name,room,starts_at,ends_at)')
        .eq('student_id', student.dbId)
        .order('recorded_at', { ascending: false })

      if (cancelled) return

      if (err) {
        setError('Impossible de charger les présences.')
        setData(null)
        setLoading(false)
        return
      }

      const entries: AttendanceEntry[] = (rows || []).map(r => {
        const date = new Date(r.recorded_at as string) // sert uniquement à savoir quel jour
        const course = r.courses as unknown as { name: string; room: string; starts_at: string | null; ends_at: string | null } | null
        const start = course?.starts_at ? new Date(course.starts_at) : null
        const end = course?.ends_at ? new Date(course.ends_at) : null
        const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const time = start && end ? `${fmt(start)} – ${fmt(end)}` : start ? fmt(start) : fmt(date)
        return {
          id: r.id as string,
          time,
          course: course?.name || 'Cours',
          room: course?.room || '—',
          date,
          status: (r.status as string) === 'present' ? 'present' : 'absent',
        }
      })

      const now = new Date()
      const todayKey = dayKey(now)
      const today = entries
        .filter(e => dayKey(e.date) === todayKey)
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      const weekStart = startOfWeek(now)
      const week: WeekDay[] = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        const key = dayKey(d)
        const dayEntries = entries.filter(e => dayKey(e.date) === key)
        return {
          label: DAY_LETTERS[i],
          num: d.getDate(),
          date: d,
          hasRecord: dayEntries.length > 0,
          done: dayEntries.some(e => e.status === 'present'),
          isToday: key === todayKey,
        }
      })

      const presentCount = entries.filter(e => e.status === 'present').length
      const attendanceRate = entries.length > 0 ? Math.round((presentCount / entries.length) * 100) : 0
      const todayPresentCount = today.filter(e => e.status === 'present').length

      if (!cancelled) {
        setData({
          entries,
          today,
          todayLabel: formatDayLabel(now),
          week,
          attendanceRate,
          todayPresentCount,
          todayTotalCount: today.length,
        })
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [student])

  return { data, loading, error }
}

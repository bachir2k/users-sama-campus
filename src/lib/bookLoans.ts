import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useStudent } from '../context/StudentContext'

export type LoanStatus = 'returned' | 'active' | 'overdue'

export interface BookLoan {
  id: string
  title: string
  borrowedAt: Date
  dueDate: Date
  returnedAt: Date | null
  status: LoanStatus
}

interface BookLoansData {
  loans: BookLoan[]
  activeCount: number
  overdueCount: number
}

export function formatLoanDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function useBookLoans() {
  const { student } = useStudent()
  const [data, setData] = useState<BookLoansData | null>(null)
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
        .from('book_loans')
        .select('id,book_title,borrowed_at,due_date,returned_at,status')
        .eq('student_id', student.dbId)
        .order('borrowed_at', { ascending: false })

      if (cancelled) return

      if (err) {
        setError('Impossible de charger les emprunts.')
        setData(null)
        setLoading(false)
        return
      }

      const now = new Date()
      const loans: BookLoan[] = (rows || []).map(r => {
        const returnedAt = r.returned_at ? new Date(r.returned_at as string) : null
        const dueDate = new Date(r.due_date as string)
        const rawStatus = r.status as string
        const status: LoanStatus =
          rawStatus === 'returned' ? 'returned' : dueDate < now ? 'overdue' : 'active'
        return {
          id: r.id as string,
          title: (r.book_title as string) || 'Ouvrage',
          borrowedAt: new Date(r.borrowed_at as string),
          dueDate,
          returnedAt,
          status,
        }
      })

      if (!cancelled) {
        setData({
          loans,
          activeCount: loans.filter(l => l.status === 'active').length,
          overdueCount: loans.filter(l => l.status === 'overdue').length,
        })
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [student])

  return { data, loading, error }
}

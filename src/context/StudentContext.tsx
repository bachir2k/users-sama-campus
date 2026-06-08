import React, { createContext, useContext } from 'react'
import { useStudentSession, type StudentProfile } from '../lib/db'
import type { Transaction } from '../data/mockData'

interface StudentContextValue {
  student: StudentProfile | null
  transactions: Transaction[]
  loading: boolean
  error: string
  refetch: () => void
}

const StudentContext = createContext<StudentContextValue | null>(null)

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const value = useStudentSession()
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used within StudentProvider')
  return ctx
}

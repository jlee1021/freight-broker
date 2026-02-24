import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiJson } from './api'

export type Me = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  partner_id?: string | null
  partner_name?: string | null
  partner_type?: string | null
} | null

const AuthContext = createContext<Me | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | undefined>(undefined)
  useEffect(() => {
    apiJson<Me>('/auth/me').then(setMe).catch(() => setMe(null))
  }, [])
  return <AuthContext.Provider value={me}>{children}</AuthContext.Provider>
}

export function useMe(): Me | undefined {
  return useContext(AuthContext)
}

/** true only when loaded and role is admin; false when loading or non-admin */
export function useIsAdmin(): boolean {
  const me = useMe()
  return me !== undefined && (me?.role ?? '').toLowerCase() === 'admin'
}

/** 고객/캐리어 포털 사용자(partner_id 있음) — 내 로드·인보이스만 보는 전용 화면 */
export function useIsPortalUser(): boolean {
  const me = useMe()
  return me !== undefined && !!me?.partner_id
}

/** undefined = loading, Me = loaded */
export function useMeLoaded(): Me | undefined {
  return useMe()
}

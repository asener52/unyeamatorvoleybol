import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hashPassword } from '../lib/crypto'

const MemberAuthContext = createContext(null)

// Her formatta girilen telefonu +90XXXXXXXXXX formatına normalize et
function normalizePhone(raw) {
  const digits = String(raw).trim().replace(/\D/g, '')
  if (digits.length === 10) return '+90' + digits                          // 5XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('0')) return '+90' + digits.slice(1) // 05XXXXXXXXX
  if (digits.length === 12 && digits.startsWith('90')) return '+' + digits // 905XXXXXXXXX
  return raw.trim()
}

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(() => {
    try { return JSON.parse(localStorage.getItem('member_session')) } catch { return null }
  })

  async function login(phone, password) {
    const password_hash = await hashPassword(password)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', normalizePhone(phone))
      .eq('status', 'approved')
      .eq('password_hash', password_hash)
      .single()
    if (error || !data) throw new Error('Telefon numarası veya şifre hatalı.')
    const session = { id: data.id, name: data.name, phone: data.phone, position: data.position, email: data.email, avatar_url: data.avatar_url || null, team: data.team || null }
    localStorage.setItem('member_session', JSON.stringify(session))
    sessionStorage.setItem('member_verified', JSON.stringify(session))
    setMember(session)
    return session
  }

  function updateSession(patch) {
    setMember(prev => {
      const updated = { ...prev, ...patch }
      localStorage.setItem('member_session', JSON.stringify(updated))
      sessionStorage.setItem('member_verified', JSON.stringify(updated))
      return updated
    })
  }

  function logout() {
    localStorage.removeItem('member_session')
    sessionStorage.removeItem('member_verified')
    setMember(null)
  }

  return (
    <MemberAuthContext.Provider value={{ member, login, logout, updateSession }}>
      {children}
    </MemberAuthContext.Provider>
  )
}

export function useMember() {
  return useContext(MemberAuthContext)
}

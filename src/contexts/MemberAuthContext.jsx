import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hashPassword } from '../lib/crypto'

const MemberAuthContext = createContext(null)

// Telefondaki son 10 haneyi çıkar (5XXXXXXXXX)
function extract10(raw) {
  return String(raw).replace(/\D/g, '').slice(-10)
}

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(() => {
    try { return JSON.parse(localStorage.getItem('member_session')) } catch { return null }
  })

  async function login(phone, password) {
    const password_hash = await hashPassword(password)
    const digits10 = extract10(phone)
    if (digits10.length < 10) throw new Error('Geçersiz telefon numarası.')
    // DB'de +90..., 0..., veya 5... formatında olabilir — son 10 hane ile eşleştir
    const { data: rows, error } = await supabase
      .from('members')
      .select('*')
      .ilike('phone', `%${digits10}`)
      .eq('status', 'approved')
      .eq('password_hash', password_hash)
      .limit(1)
    const data = rows?.[0]
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

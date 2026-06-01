import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

const MemberAuthContext = createContext(null)

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(() => {
    try { return JSON.parse(localStorage.getItem('member_session')) } catch { return null }
  })

  async function login(phone) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', phone.trim())
      .eq('status', 'approved')
      .single()
    if (error || !data) throw new Error('Bu telefon numarasıyla onaylı üye bulunamadı.')
    const session = { id: data.id, name: data.name, phone: data.phone, position: data.position, email: data.email }
    localStorage.setItem('member_session', JSON.stringify(session))
    sessionStorage.setItem('member_verified', JSON.stringify(session))
    setMember(session)
    return session
  }

  function logout() {
    localStorage.removeItem('member_session')
    sessionStorage.removeItem('member_verified')
    setMember(null)
  }

  return (
    <MemberAuthContext.Provider value={{ member, login, logout }}>
      {children}
    </MemberAuthContext.Provider>
  )
}

export function useMember() {
  return useContext(MemberAuthContext)
}

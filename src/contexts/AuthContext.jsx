import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout fallback: if Firebase auth doesn't respond (e.g. offline/demo config), unblock UI
    const timeout = setTimeout(() => setLoading(false), 3000)

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout)
      setUser(currentUser)
      setLoading(false)
    })
    return () => { clearTimeout(timeout); unsubscribe() }
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

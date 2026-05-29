import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000)
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'siteConfig'),
      (snap) => {
        clearTimeout(timeout)
        setSettings(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      () => { clearTimeout(timeout); setLoading(false) }
    )
    return () => { clearTimeout(timeout); unsubscribe() }
  }, [])

  return { settings, loading }
}

export async function saveSettings(data) {
  return setDoc(doc(db, 'settings', 'siteConfig'), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'siteConfig')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Settings yüklenemedi:', error.message)
    }
    setSettings(data?.data || null)
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()
    // Settings nadiren güncellenir; realtime yerine sayfa yüklenince tek fetch yeterli
  }, [])

  // Tarayıcı sekme başlığını dinamik güncelle
  useEffect(() => {
    if (settings?.brand?.name) {
      document.title = settings.brand.name
    }
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings: setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsCtx() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsCtx, SettingsProvider içinde kullanılmalıdır')
  return ctx
}

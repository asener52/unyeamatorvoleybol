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

    const channelName = `settings_global_${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Tarayıcı sekme başlığını dinamik güncelle
  useEffect(() => {
    if (settings?.brand?.name) {
      document.title = settings.brand.name
    }
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsCtx() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsCtx, SettingsProvider içinde kullanılmalıdır')
  return ctx
}

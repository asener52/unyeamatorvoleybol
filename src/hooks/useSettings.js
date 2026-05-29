import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
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

    const channel = supabase
      .channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { settings, loading }
}

export async function saveSettings(data) {
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 'siteConfig', data, updated_at: new Date().toISOString() })
  if (error) throw error
}

import { supabase } from '../lib/supabase'
import { useSettingsCtx } from '../contexts/SettingsContext'

// Tüm bileşenler bu hook üzerinden context'e erişir (tek Supabase sorgusu)
export function useSettings() {
  return useSettingsCtx()
}

export async function saveSettings(data) {
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 'siteConfig', data, updated_at: new Date().toISOString() })
  if (error) throw error
}

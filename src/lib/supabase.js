import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

function sanitizeFilename(filename) {
  const ext = filename.slice(filename.lastIndexOf('.'))
  const name = filename.slice(0, filename.lastIndexOf('.'))
  return name
    .normalize('NFD')                    // Türkçe/özel karakterleri parçala
    .replace(/[̀-ͯ]/g, '')     // Aksan işaretlerini sil
    .replace(/[ğ]/gi, 'g')
    .replace(/[ü]/gi, 'u')
    .replace(/[ş]/gi, 's')
    .replace(/[ı]/gi, 'i')
    .replace(/[ö]/gi, 'o')
    .replace(/[ç]/gi, 'c')
    .replace(/[^a-zA-Z0-9_-]/g, '_')    // Geçersiz karakterleri _ yap
    .replace(/_+/g, '_')                 // Ardışık _ tek _'ye indir
    .slice(0, 80)                        // Çok uzun adları kısalt
    + ext.toLowerCase()
}

// Supabase Storage: görsel yükle ve public URL döndür
// bucket: 'news' | 'sliders' | 'gallery' | 'events'
export async function uploadFile(bucket, filename, file) {
  const safeName = sanitizeFilename(filename)
  const uniquePart = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const path = `${uniquePart}_${safeName}`
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type || undefined })

      if (error) throw new Error(error.message)

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (error) {
      lastError = error
      const isNetworkError = /failed to fetch|network|fetch/i.test(error?.message || '')
      if (!isNetworkError || attempt === 3) break
      await new Promise(resolve => setTimeout(resolve, attempt * 750))
    }
  }

  throw new Error(lastError?.message || 'Dosya yüklenemedi')
}

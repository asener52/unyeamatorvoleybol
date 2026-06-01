/**
 * Supabase Edge Function: send-notification
 *
 * Supabase Database Webhook'larından tetiklenir.
 * news, events, polls, gallery tablolarına INSERT yapıldığında
 * FCM Topic bildirimi gönderir.
 *
 * KURULUM:
 * 1. Firebase Console → Proje Ayarları → Hizmet Hesapları → "Yeni özel anahtar oluştur"
 *    indirilen JSON'u Supabase Dashboard → Edge Functions → Secrets'a ekle:
 *    FIREBASE_SERVICE_ACCOUNT = <JSON içeriği tek satır>
 *    FIREBASE_PROJECT_ID      = unyeamatorsporlartoplulu-30794
 *
 * 2. Supabase Dashboard → Database → Webhooks → "Create a new hook":
 *    - news    tablosu INSERT → bu fonksiyon
 *    - events  tablosu INSERT → bu fonksiyon
 *    - polls   tablosu INSERT → bu fonksiyon
 *    - gallery tablosu INSERT → bu fonksiyon
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// FCM v1 API için OAuth2 token al
async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Private key'i import et
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const keyBuffer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${signature}`

  // OAuth2 token al
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

// FCM Topic'e bildirim gönder
async function sendFcmNotification(
  projectId: string,
  accessToken: string,
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const message = {
    message: {
      topic,
      notification: { title, body },
      android: {
        notification: {
          channel_id: 'unyevoleybol_channel',
          sound: 'default',
          priority: 'high',
        },
      },
      data: { topic, ...data },
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  })

  return res.json()
}

serve(async (req) => {
  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'unyeamatorsporlartoplulu-30794'

    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT secret eksik' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const payload = await req.json()

    // Supabase webhook payload: { type, table, record, old_record }
    const { type, table, record } = payload

    if (type !== 'INSERT' || !record?.published) {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Tabloya göre bildirim içeriği belirle
    const notifications: Record<string, { topic: string; title: string; body: string }> = {
      news:    { topic: 'haberler',    title: '📰 Yeni Haber Eklendi',    body: record.title ?? 'Yeni bir haber yayınlandı' },
      events:  { topic: 'etkinlikler', title: '📅 Yeni Etkinlik Eklendi',  body: record.title ?? 'Yeni bir etkinlik eklendi' },
      polls:   { topic: 'anketler',    title: '📊 Yeni Anket Eklendi',     body: record.question ?? 'Yeni bir anket oluşturuldu' },
      gallery: { topic: 'galeri',      title: '🖼️ Galeriye Yeni Fotoğraf', body: record.title ?? 'Yeni fotoğraflar eklendi' },
      sliders: { topic: 'genel',       title: '🏐 Ünye Voleybol',          body: record.title ?? 'Yeni içerik eklendi' },
    }

    const notif = notifications[table]
    if (!notif) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Bilinmeyen tablo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(serviceAccount)
    const result = await sendFcmNotification(
      projectId,
      accessToken,
      notif.topic,
      notif.title,
      notif.body,
      { record_id: record.id?.toString() ?? '' }
    )

    console.log(`[${table}] FCM gönderildi:`, JSON.stringify(result))

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge Function hatası:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

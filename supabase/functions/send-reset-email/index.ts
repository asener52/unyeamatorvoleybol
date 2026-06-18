/**
 * Supabase Edge Function: send-reset-email
 *
 * Şifre sıfırlama kodunu e-posta ile gönderir (Resend API kullanır).
 *
 * KURULUM:
 * 1. https://resend.com → ücretsiz hesap aç → API Keys → bir anahtar oluştur
 * 2. Supabase Dashboard → Edge Functions → Secrets:
 *    RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
 *    SITE_URL       = https://sizin-site-adresiniz.com  (CORS için)
 *
 * 3. Supabase Dashboard → Edge Functions → Deploy (supabase CLI veya dashboard)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Telefon numarası gerekli.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Supabase admin client (service role key ile)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Üyeyi bul
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, name, email')
      .eq('phone', phone.trim())
      .eq('status', 'approved')
      .single()

    if (memberErr || !member) {
      // Güvenlik: hangi telefon var/yok bilgisi verme
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!member.email) {
      return new Response(JSON.stringify({ error: 'Bu üyenin kayıtlı e-postası yok. Yönetici ile iletişime geçin.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6 haneli kod üret ve hash'le
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const encoder = new TextEncoder()
    const data = encoder.encode(code)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // DB'ye token kaydet
    await supabase.from('members').update({
      reset_token: codeHash,
      reset_token_expires_at: expiresAt,
    }).eq('id', member.id)

    // Resend ile e-posta gönder
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY secret eksik')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ünye Voleybol <noreply@resend.dev>',
        to: [member.email],
        subject: 'Şifre Sıfırlama Kodunuz',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#1e3a5f">Merhaba ${member.name},</h2>
            <p>Şifre sıfırlama talebiniz alındı. Aşağıdaki kodu kullanın:</p>
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
              <p style="font-size:13px;color:#92400e;font-weight:600;margin:0 0 8px">Doğrulama Kodunuz</p>
              <p style="font-size:36px;font-weight:800;letter-spacing:0.3em;color:#78350f;margin:0">${code}</p>
              <p style="font-size:12px;color:#b45309;margin:8px 0 0">30 dakika geçerlidir.</p>
            </div>
            <p style="color:#6b7280;font-size:13px">Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#9ca3af;font-size:12px">Ünye Amatör Voleybol Topluluğu</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      throw new Error(`Resend hatası: ${errBody}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-reset-email hatası:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

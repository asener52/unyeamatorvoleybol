import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaVolleyballBall, FaUser, FaPhone, FaEnvelope, FaCheckCircle } from 'react-icons/fa'

const POSITIONS = ['Pasör', 'Libero', 'Fil', 'Dış Vurucu', 'Orta Oyuncu', 'Seyirci']

export default function MembershipPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', position: 'Dış Vurucu' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error: err } = await supabase.from('members').insert([{
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        position: form.position,
        status: 'bekliyor'
      }])
      if (err) throw err
      setDone(true)
    } catch (err) {
      setError('Bir hata oluştu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Başvurunuz Alındı!</h2>
        <p className="text-slate-500">Yönetici başvurunuzu inceleyecek ve sizinle iletişime geçecek.</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-primary-900 mb-2">Topluluğa Üye Ol</h1>
        <p className="text-slate-500">Formı doldurun, yönetici onayından sonra aktif üye olursunuz.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad Soyad *</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon *</label>
          <div className="relative">
            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="05XX XXX XX XX"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-posta <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="ornek@email.com"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pozisyon / Katılım Türü *</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map(pos => (
              <button key={pos} type="button" onClick={() => setForm(f => ({ ...f, position: pos }))}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.position === pos
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                {pos}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        <button type="submit" disabled={saving}
          className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm">
          {saving ? 'Gönderiliyor...' : 'Üyelik Başvurusu Yap'}
        </button>
        <p className="text-center text-xs text-slate-400">Bilgileriniz yalnızca yönetici tarafından görülür.</p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaVolleyballBall, FaUser, FaPhone, FaCheckCircle } from 'react-icons/fa'

export default function MatchRequestPage() {
  const [form, setForm] = useState({ name: '', phone: '', type: 'oyuncu' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('match_requests')
        .insert([{ name: form.name.trim(), phone: form.phone.trim(), type: form.type }])
      if (err) throw err
      setDone(true)
    } catch (err) {
      setError('Bir hata oluştu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Talebiniz Alındı!</h2>
          <p className="text-slate-500 mb-6">
            {form.type === 'oyuncu'
              ? 'Oyuncu olarak katılım talebiniz iletildi. Yönetici sizinle iletişime geçecek.'
              : 'Seyirci olarak katılım talebiniz iletildi. Sizi aramızda görmekten mutluluk duyarız!'}
          </p>
          <button
            onClick={() => { setDone(false); setForm({ name: '', phone: '', type: 'oyuncu' }) }}
            className="text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors"
          >
            Yeni talep oluştur
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Başlık */}
      <div className="text-center mb-10">
        <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-4 animate-bounce" style={{ animationDuration: '2s' }} />
        <h1 className="text-3xl font-extrabold text-primary-900 mb-2">Bu Haftaki Maça Gel!</h1>
        <p className="text-slate-500">Katılmak istediğinizi bildirin, yönetici sizinle iletişime geçsin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">

        {/* Ad Soyad */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad Soyad *</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Adınız ve soyadınız"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numarası *</label>
          <div className="relative">
            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="05XX XXX XX XX"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Katılım Türü */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Katılım Türü *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: 'oyuncu' }))}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.type === 'oyuncu'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <FaVolleyballBall size={24} className={form.type === 'oyuncu' ? 'text-primary-600' : 'text-slate-400'} />
              <div>
                <div className="font-bold text-sm">Oyuncu</div>
                <div className="text-xs opacity-70">Maçta oynamak istiyorum</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: 'seyirci' }))}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.type === 'seyirci'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <span className={`text-2xl ${form.type === 'seyirci' ? 'text-primary-600' : 'text-slate-400'}`}>👁️</span>
              <div>
                <div className="font-bold text-sm">Seyirci</div>
                <div className="text-xs opacity-70">İzlemek istiyorum</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Gönderiliyor...' : 'Katılım Talebimi Gönder'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Bilgileriniz yalnızca yönetici tarafından görülür.
        </p>
      </form>
    </div>
  )
}

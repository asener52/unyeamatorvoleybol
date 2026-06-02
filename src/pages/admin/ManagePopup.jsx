import { useState, useEffect } from 'react'
import { supabase, uploadFile } from '../../lib/supabase'
import { FaSave, FaToggleOn, FaToggleOff, FaImage, FaUpload } from 'react-icons/fa'

const DEFAULT = {
  enabled: false,
  title: '',
  content: '',
  imageUrl: '',
  buttonText: 'Tamam',
  showEveryTime: true,
}

export default function ManagePopup() {
  const [form, setForm] = useState(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select().eq('id', 'popupConfig').maybeSingle()
      .then(({ data }) => {
        if (data?.data) setForm({ ...DEFAULT, ...data.data })
        setLoading(false)
      })
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('settings')
        .upsert({ id: 'popupConfig', data: form, updated_at: new Date().toISOString() })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile('gallery', file.name, file)
      setForm(f => ({ ...f, imageUrl: url }))
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Popup Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-0.5">Uygulama açıldığında kullanıcılara gösterilecek popup bildirimi</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Etkinleştir */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Popup Durumu</div>
              <div className="text-sm text-slate-500 mt-0.5">
                {form.enabled ? 'Popup aktif — kullanıcılara gösterilecek' : 'Popup pasif — kimseye gösterilmeyecek'}
              </div>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
              {form.enabled
                ? <FaToggleOn className="text-primary-600" size={40} />
                : <FaToggleOff className="text-slate-300" size={40} />}
            </button>
          </div>
        </div>

        {/* Görüntüleme sıklığı */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="font-semibold text-slate-800 mb-3">Görüntüleme Sıklığı</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: true,  label: 'Her açılışta', desc: 'Uygulama her açıldığında göster' },
              { val: false, label: 'Günde bir kez', desc: 'Her gün yalnızca bir kez göster' },
            ].map(opt => (
              <button key={String(opt.val)} type="button"
                onClick={() => setForm(f => ({ ...f, showEveryTime: opt.val }))}
                className={`text-left p-3 rounded-xl border-2 transition-all ${form.showEveryTime === opt.val ? 'border-primary-600 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className={`font-semibold text-sm ${form.showEveryTime === opt.val ? 'text-primary-700' : 'text-slate-700'}`}>{opt.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* İçerik */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="font-semibold text-slate-800">Popup İçeriği</div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Örn: Önemli Duyuru"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label>
            <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Popup'ta gösterilecek mesaj..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          {/* Görsel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Görsel (isteğe bağlı)</label>
            <div className="flex items-start gap-3">
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="" className="w-24 h-20 object-contain rounded-xl border bg-slate-50" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                </div>
              ) : null}
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors w-fit">
                  <FaUpload size={13} /> {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="ya da görsel URL yapıştırın"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buton Metni</label>
            <input value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
              placeholder="Tamam"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        {/* Önizleme */}
        {(form.title || form.content) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="font-semibold text-slate-800 mb-3">Önizleme</div>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-w-xs mx-auto">
              {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full object-contain max-h-48 bg-slate-50" />}
              <div className="p-4">
                {form.title && <div className="font-bold text-slate-800 text-base mb-2">{form.title}</div>}
                {form.content && <div className="text-slate-600 text-sm mb-4 whitespace-pre-line">{form.content}</div>}
                <button type="button" className="w-full bg-primary-700 text-white py-2 rounded-lg text-sm font-semibold">
                  {form.buttonText || 'Tamam'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
          <FaSave size={14} />
          {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </form>
    </div>
  )
}

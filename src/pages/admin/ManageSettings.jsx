import { useState, useEffect } from 'react'
import { useSettings, saveSettings } from '../../hooks/useSettings'
import { FaPlus, FaMinus, FaSave, FaCheckCircle } from 'react-icons/fa'

export default function ManageSettings() {
  const { settings, loading } = useSettings()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    brand: { name: '', shortName: '', tagline: '', copyright: '' },
    about: { title: '', description: '', story: '', values: [] },
    contact: { address: '', phone: '', email: '' },
    social: { facebook: '', instagram: '', youtube: '', twitter: '', whatsapp: '', tiktok: '' },
    stats: [],
    ctaTitle: '',
    ctaText: '',
    ctaEmail: '',
    team: [],
  })

  useEffect(() => {
    if (settings) {
      setForm({
        brand: settings.brand || { name: '', shortName: '', tagline: '', copyright: '' },
        about: settings.about || { title: '', description: '', story: '', values: [] },
        contact: settings.contact || { address: '', phone: '', email: '' },
        social: settings.social || { facebook: '', instagram: '', youtube: '', twitter: '', whatsapp: '', tiktok: '' },
        stats: settings.stats || [],
        ctaTitle: settings.ctaTitle || '',
        ctaText: settings.ctaText || '',
        ctaEmail: settings.ctaEmail || '',
        team: settings.team || [],
      })
    }
  }, [settings])

  function setNested(section, field, value) {
    setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }))
  }

  function addStat() {
    setForm(f => ({ ...f, stats: [...f.stats, { label: '', value: '' }] }))
  }
  function updateStat(i, key, val) {
    setForm(f => { const s = [...f.stats]; s[i] = { ...s[i], [key]: val }; return { ...f, stats: s } })
  }
  function removeStat(i) {
    setForm(f => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }))
  }

  function addValue() {
    setForm(f => ({ ...f, about: { ...f.about, values: [...(f.about.values || []), { title: '', text: '' }] } }))
  }
  function updateValue(i, key, val) {
    setForm(f => { const v = [...(f.about.values || [])]; v[i] = { ...v[i], [key]: val }; return { ...f, about: { ...f.about, values: v } } })
  }
  function removeValue(i) {
    setForm(f => ({ ...f, about: { ...f.about, values: f.about.values.filter((_, idx) => idx !== i) } }))
  }

  function addTeam() {
    setForm(f => ({ ...f, team: [...f.team, { name: '', role: '', img: '' }] }))
  }
  function updateTeam(i, key, val) {
    setForm(f => { const t = [...f.team]; t[i] = { ...t[i], [key]: val }; return { ...f, team: t } })
  }
  function removeTeam(i) {
    setForm(f => ({ ...f, team: f.team.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-slate-400 text-center py-20">Yükleniyor...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Site Ayarları</h1>
          <p className="text-slate-500 text-sm mt-0.5">Marka, iletişim, sosyal medya ve içerik ayarları</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm bg-green-50 px-4 py-2 rounded-lg">
            <FaCheckCircle /> Kaydedildi
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-6 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
        Boş bırakılan alanlar sitede otomatik olarak gizlenir.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Site Markası */}
        <Section title="Site Markası" subtitle="Navbar ve footer'da görünen marka bilgileri">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Site Adı">
              <input value={form.brand.name} onChange={e => setNested('brand', 'name', e.target.value)}
                placeholder="Ünye Amatör Voleybolcular" className={input} />
            </Field>
            <Field label="Kısa Ad (mobil için)">
              <input value={form.brand.shortName} onChange={e => setNested('brand', 'shortName', e.target.value)}
                placeholder="ÜAV" className={input} />
            </Field>
            <Field label="Slogan">
              <input value={form.brand.tagline} onChange={e => setNested('brand', 'tagline', e.target.value)}
                placeholder="Spor Topluluğu" className={input} />
            </Field>
            <Field label="Footer Telif Hakkı Metni">
              <input value={form.brand.copyright} onChange={e => setNested('brand', 'copyright', e.target.value)}
                placeholder="Ünye Amatör Voleybolcular" className={input} />
            </Field>
          </div>
        </Section>

        {/* İletişim */}
        <Section title="İletişim Bilgileri" subtitle="Footer ve hakkımızda sayfasında görünür">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Adres">
              <input value={form.contact.address} onChange={e => setNested('contact', 'address', e.target.value)}
                placeholder="Ünye Spor Kompleksi, Ordu" className={input} />
            </Field>
            <Field label="Telefon">
              <input value={form.contact.phone} onChange={e => setNested('contact', 'phone', e.target.value)}
                placeholder="+90 452 000 00 00" className={input} />
            </Field>
            <Field label="E-posta">
              <input type="email" value={form.contact.email} onChange={e => setNested('contact', 'email', e.target.value)}
                placeholder="info@unyevoleybol.com" className={input} />
            </Field>
          </div>
        </Section>

        {/* Sosyal Medya */}
        <Section title="Sosyal Medya" subtitle="Boş bırakılan platformlar gizlenir">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'facebook',  label: 'Facebook',   ph: 'https://facebook.com/sayfaniz' },
              { key: 'instagram', label: 'Instagram',  ph: 'https://instagram.com/sayfaniz' },
              { key: 'youtube',   label: 'YouTube',    ph: 'https://youtube.com/@kanaliniz' },
              { key: 'twitter',   label: 'Twitter / X', ph: 'https://x.com/hesabiniz' },
              { key: 'whatsapp',  label: 'WhatsApp (telefon numarası)', ph: '905321234567' },
              { key: 'tiktok',    label: 'TikTok',     ph: 'https://tiktok.com/@hesabiniz' },
            ].map(({ key, label, ph }) => (
              <Field key={key} label={label}>
                <input value={form.social[key] || ''} onChange={e => setNested('social', key, e.target.value)}
                  placeholder={ph} className={input} />
              </Field>
            ))}
          </div>
        </Section>

        {/* İstatistikler */}
        <Section title="İstatistik Barı" subtitle="Ana sayfada görüntülenecek sayılar (max 6)">
          <div className="space-y-2">
            {form.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <input value={s.value} onChange={e => updateStat(i, 'value', e.target.value)}
                  placeholder="45+" className={`${input} w-28`} />
                <input value={s.label} onChange={e => updateStat(i, 'label', e.target.value)}
                  placeholder="Aktif Üye" className={`${input} flex-1`} />
                <button type="button" onClick={() => removeStat(i)} className="text-red-400 hover:text-red-600 p-1.5"><FaMinus size={13} /></button>
              </div>
            ))}
            {form.stats.length < 6 && (
              <button type="button" onClick={addStat} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium mt-1">
                <FaPlus size={11} /> İstatistik ekle
              </button>
            )}
          </div>
        </Section>

        {/* CTA Banner */}
        <Section title="CTA Banner" subtitle="Ana sayfadaki davet bölümü">
          <div className="space-y-3">
            <Field label="Başlık">
              <input value={form.ctaTitle} onChange={e => setForm(f => ({ ...f, ctaTitle: e.target.value }))}
                placeholder="Topluluğumuza Katılın!" className={input} />
            </Field>
            <Field label="Metin">
              <textarea rows={3} value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                placeholder="Voleybol sevginizi bizimle paylaşın..." className={`${input} resize-none`} />
            </Field>
            <Field label="Buton E-posta (boş bırakılırsa buton gizlenir)">
              <input type="email" value={form.ctaEmail} onChange={e => setForm(f => ({ ...f, ctaEmail: e.target.value }))}
                placeholder="info@unyevoleybol.com" className={input} />
            </Field>
          </div>
        </Section>

        {/* Hakkımızda */}
        <Section title="Hakkımızda Sayfası">
          <div className="space-y-3">
            <Field label="Başlık">
              <input value={form.about.title} onChange={e => setNested('about', 'title', e.target.value)}
                placeholder="Ünye Amatör Voleybolcular" className={input} />
            </Field>
            <Field label="Kısa Açıklama">
              <textarea rows={3} value={form.about.description} onChange={e => setNested('about', 'description', e.target.value)}
                placeholder="Topluluğunuz hakkında kısa bir metin..." className={`${input} resize-none`} />
            </Field>
            <Field label="Hikaye">
              <textarea rows={5} value={form.about.story} onChange={e => setNested('about', 'story', e.target.value)}
                placeholder="Topluluğun kuruluş hikayesi..." className={`${input} resize-none`} />
            </Field>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Değerler (max 3)</p>
            <div className="space-y-2">
              {(form.about.values || []).map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)}
                    placeholder="Başlık" className={`${input} w-36`} />
                  <input value={v.text} onChange={e => updateValue(i, 'text', e.target.value)}
                    placeholder="Açıklama" className={`${input} flex-1`} />
                  <button type="button" onClick={() => removeValue(i)} className="text-red-400 hover:text-red-600 p-1.5 mt-0.5"><FaMinus size={13} /></button>
                </div>
              ))}
              {(form.about.values || []).length < 3 && (
                <button type="button" onClick={addValue} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium">
                  <FaPlus size={11} /> Değer ekle
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Ekip */}
        <Section title="Ekip Üyeleri">
          <div className="space-y-2">
            {form.team.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <input value={m.name} onChange={e => updateTeam(i, 'name', e.target.value)}
                  placeholder="Ad Soyad" className={`${input} flex-1`} />
                <input value={m.role} onChange={e => updateTeam(i, 'role', e.target.value)}
                  placeholder="Görev" className={`${input} w-36`} />
                <input value={m.img} onChange={e => updateTeam(i, 'img', e.target.value)}
                  placeholder="Fotoğraf URL" className={`${input} flex-1`} />
                <button type="button" onClick={() => removeTeam(i)} className="text-red-400 hover:text-red-600 p-1.5"><FaMinus size={13} /></button>
              </div>
            ))}
            <button type="button" onClick={addTeam} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium">
              <FaPlus size={11} /> Üye ekle
            </button>
          </div>
        </Section>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors">
          <FaSave /> {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
        </button>
      </form>
    </div>
  )
}

const input = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="font-bold text-slate-800 text-base mb-0.5">{title}</h2>
      {subtitle && <p className="text-slate-400 text-xs mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

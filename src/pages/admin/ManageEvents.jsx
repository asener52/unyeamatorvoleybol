import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage, FaSync, FaCalendarAlt } from 'react-icons/fa'
import { format, addDays, parseISO, isWithinInterval } from 'date-fns'
import { tr } from 'date-fns/locale'

const EVENT_TYPES = ['Antrenman', 'Maç', 'Turnuva', 'Sosyal', 'Toplantı', 'Diğer']

const WEEKDAYS = [
  { key: 1, label: 'Pzt' },
  { key: 2, label: 'Sal' },
  { key: 3, label: 'Çar' },
  { key: 4, label: 'Per' },
  { key: 5, label: 'Cum' },
  { key: 6, label: 'Cmt' },
  { key: 0, label: 'Paz' },
]

const EMPTY_FORM = {
  title: '', description: '', type: 'Antrenman',
  dateStr: '', timeStart: '', timeEnd: '',
  location: '', capacity: '', imageUrl: '', published: false,
  // tekrarlayan
  recurring: false,
  recurDays: [],
  recurStart: '',
  recurEnd: '',
  applyImageToAll: false, // toplu resim uygulama
}

function parseTimeRange(time) {
  if (!time) return { timeStart: '', timeEnd: '' }
  const parts = time.split(/\s*[-–]\s*/)
  return { timeStart: parts[0]?.trim() || '', timeEnd: parts[1]?.trim() || '' }
}
function buildTimeRange(start, end) {
  if (!start && !end) return ''
  if (!end) return start
  return `${start} - ${end}`
}
function formatDate(val) {
  if (!val) return ''
  try { return format(new Date(val), 'd MMM yyyy', { locale: tr }) } catch { return '' }
}

/** Bir tarih aralığındaki belirli haftanın günlerine denk gelen tüm tarihleri döner */
function generateRecurringDates(startStr, endStr, days) {
  if (!startStr || !endStr || !days.length) return []
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  const results = []
  let cur = start
  while (cur <= end) {
    if (days.includes(cur.getDay())) {
      results.push(format(cur, 'yyyy-MM-dd'))
    }
    cur = addDays(cur, 1)
  }
  return results
}

export default function ManageEvents() {
  const [params] = useSearchParams()
  const { docs, loading } = useCollection('events', 'date', 200)
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')
  const [previewDates, setPreviewDates] = useState([])

  function openNew() {
    setForm(EMPTY_FORM); setEditId(null); setImgPreview(''); setImgFile(null)
    setPreviewDates([]); setShowForm(true)
  }

  function openEdit(doc) {
    const { timeStart, timeEnd } = parseTimeRange(doc.time)
    setForm({
      title: doc.title || '', description: doc.description || '', type: doc.type || 'Antrenman',
      dateStr: doc.date ? String(doc.date).slice(0, 10) : '',
      timeStart, timeEnd, location: doc.location || '',
      capacity: doc.capacity?.toString() || '',
      imageUrl: doc.imageUrl || '', published: doc.published ?? false,
      recurring: false, recurDays: [], recurStart: '', recurEnd: '',
    })
    setEditId(doc.id); setImgPreview(doc.imageUrl || ''); setImgFile(null)
    setPreviewDates([]); setShowForm(true)
  }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file); setImgPreview(URL.createObjectURL(file))
  }

  function toggleRecurDay(day) {
    const next = form.recurDays.includes(day)
      ? form.recurDays.filter(d => d !== day)
      : [...form.recurDays, day]
    const dates = generateRecurringDates(form.recurStart, form.recurEnd, next)
    setForm(f => ({ ...f, recurDays: next }))
    setPreviewDates(dates)
  }

  function handleRecurDateChange(field, val) {
    const updated = { ...form, [field]: val }
    const dates = generateRecurringDates(updated.recurStart, updated.recurEnd, updated.recurDays)
    setForm(updated)
    setPreviewDates(dates)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let imageUrl = form.imageUrl
      if (imgFile) imageUrl = await uploadFile('events', imgFile.name, imgFile)

      const base = {
        title: form.title, description: form.description, type: form.type,
        time: buildTimeRange(form.timeStart, form.timeEnd),
        location: form.location,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        imageUrl, published: form.published,
      }

      if (form.recurring) {
        if (!form.recurDays.length) { alert('En az bir gün seçin'); setSaving(false); return }
        if (!form.recurStart || !form.recurEnd) { alert('Başlangıç ve bitiş tarihi seçin'); setSaving(false); return }
        if (previewDates.length === 0) { alert('Seçilen aralıkta uygun gün bulunamadı'); setSaving(false); return }
        if (previewDates.length > 52) {
          if (!confirm(`${previewDates.length} etkinlik oluşturulacak. Devam etmek istiyor musunuz?`)) { setSaving(false); return }
        }
        for (const dateStr of previewDates) {
          await addDocument('events', { ...base, date: dateStr })
        }
      } else {
        const data = { ...base, date: form.dateStr || null }
        if (editId) {
          await updateDocument('events', editId, data)
          // Toplu resim güncelleme
          if (form.applyImageToAll && imageUrl) {
            for (const doc of docs) {
              if (doc.id !== editId) await updateDocument('events', doc.id, { imageUrl })
            }
          }
        } else {
          await addDocument('events', data)
        }
      }
      setShowForm(false)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return
    await deleteDocument('events', id)
  }

  async function togglePublish(doc) {
    await updateDocument('events', doc.id, { published: !doc.published })
  }

  const typeColors = {
    'Turnuva': 'bg-red-100 text-red-700', 'Maç': 'bg-orange-100 text-orange-700',
    'Antrenman': 'bg-blue-100 text-blue-700', 'Sosyal': 'bg-green-100 text-green-700',
    'Toplantı': 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Etkinlikler</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} etkinlik</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Yeni Etkinlik
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">{editId ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Başlık + Tür */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapasite</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Saat */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saat Aralığı</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={form.timeStart} onChange={e => setForm(f => ({ ...f, timeStart: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <span className="text-slate-400 font-medium shrink-0">–</span>
                  <input type="time" value={form.timeEnd} onChange={e => setForm(f => ({ ...f, timeEnd: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Konum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konum</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              {/* Tekrarlayan toggle — sadece yeni ekleme modunda */}
              {!editId && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Tab başlıkları */}
                  <div className="flex border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, recurring: false }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                        !form.recurring ? 'bg-primary-700 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <FaCalendarAlt size={12} /> Tek Seferlik
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, recurring: true }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                        form.recurring ? 'bg-primary-700 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <FaSync size={12} /> Tekrarlayan
                    </button>
                  </div>

                  <div className="p-4">
                    {!form.recurring ? (
                      /* Tek seferlik tarih */
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                        <input type="date" value={form.dateStr} onChange={e => setForm(f => ({ ...f, dateStr: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    ) : (
                      /* Tekrarlayan modu */
                      <div className="space-y-4">
                        {/* Haftanın günleri */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Haftanın Günleri *</label>
                          <div className="flex gap-2 flex-wrap">
                            {WEEKDAYS.map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleRecurDay(key)}
                                className={`w-12 h-10 rounded-lg text-sm font-semibold border-2 transition-all ${
                                  form.recurDays.includes(key)
                                    ? 'bg-primary-600 border-primary-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-primary-300'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tarih aralığı */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç *</label>
                            <input type="date" value={form.recurStart}
                              onChange={e => handleRecurDateChange('recurStart', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş *</label>
                            <input type="date" value={form.recurEnd}
                              onChange={e => handleRecurDateChange('recurEnd', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                        </div>

                        {/* Önizleme */}
                        {previewDates.length > 0 && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-primary-700 mb-2">
                              📅 {previewDates.length} etkinlik oluşturulacak:
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {previewDates.map(d => (
                                <span key={d} className="text-xs bg-white border border-primary-200 text-primary-700 px-2 py-0.5 rounded-full">
                                  {format(parseISO(d), 'd MMM yyyy, EEE', { locale: tr })}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {form.recurDays.length > 0 && form.recurStart && form.recurEnd && previewDates.length === 0 && (
                          <p className="text-xs text-red-500">Seçilen tarih aralığında uygun gün bulunamadı.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Düzenleme modunda basit tarih alanı */}
              {editId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                  <input type="date" value={form.dateStr} onChange={e => setForm(f => ({ ...f, dateStr: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}

              {/* Görsel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Görsel</label>
                <div className="flex items-start gap-3 mb-2">
                  <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors">
                    <FaImage size={14} /> Dosya Seç
                    <input type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </label>
                  {imgPreview && <img src={imgPreview} alt="" className="h-16 w-24 object-cover rounded-lg border" />}
                </div>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="ya da URL yapıştırın"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {editId && (
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={form.applyImageToAll} onChange={e => setForm(f => ({ ...f, applyImageToAll: e.target.checked }))}
                      className="w-4 h-4 rounded text-primary-600" />
                    <span className="text-sm text-slate-600">Tüm etkinliklere uygula</span>
                  </label>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary-600" />
                <span className="text-sm font-medium text-slate-700">Yayınla</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                  {saving
                    ? (form.recurring ? `Oluşturuluyor... (${previewDates.length})` : 'Kaydediliyor...')
                    : editId ? 'Güncelle'
                    : form.recurring ? `${previewDates.length || 0} Etkinlik Oluştur`
                    : 'Ekle'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz etkinlik eklenmemiş.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Etkinlik</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Tür</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{d.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${typeColors[d.type] || 'bg-slate-100 text-slate-500'}`}>{d.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{formatDate(d.date)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(d)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${d.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.published ? <><FaEye size={10} /> Yayında</> : <><FaEyeSlash size={10} /> Taslak</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(d)} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><FaTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

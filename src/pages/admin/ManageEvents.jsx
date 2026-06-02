import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const EVENT_TYPES = ['Antrenman', 'Maç', 'Turnuva', 'Sosyal', 'Toplantı', 'Diğer']
const EMPTY_FORM = { title: '', description: '', type: 'Antrenman', dateStr: '', timeStart: '', timeEnd: '', location: '', capacity: '', imageUrl: '', published: false }

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

export default function ManageEvents() {
  const [params] = useSearchParams()
  const { docs, loading } = useCollection('events', 'date', 50)
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setImgPreview(''); setImgFile(null); setShowForm(true) }

  function openEdit(doc) {
    const { timeStart, timeEnd } = parseTimeRange(doc.time)
    setForm({
      title: doc.title || '', description: doc.description || '', type: doc.type || 'Antrenman',
      dateStr: doc.date ? String(doc.date).slice(0, 10) : '',
      timeStart, timeEnd, location: doc.location || '',
      capacity: doc.capacity?.toString() || '',
      imageUrl: doc.imageUrl || '', published: doc.published ?? false
    })
    setEditId(doc.id); setImgPreview(doc.imageUrl || ''); setImgFile(null); setShowForm(true)
  }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file); setImgPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let imageUrl = form.imageUrl
      if (imgFile) imageUrl = await uploadFile('events', imgFile.name, imgFile)
      const data = {
        title: form.title, description: form.description, type: form.type,
        date: form.dateStr || null,
        time: buildTimeRange(form.timeStart, form.timeEnd), location: form.location,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        imageUrl, published: form.published
      }
      if (editId) await updateDocument('events', editId, data)
      else await addDocument('events', data)
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

  const typeColors = { 'Turnuva': 'bg-red-100 text-red-700', 'Maç': 'bg-orange-100 text-orange-700', 'Antrenman': 'bg-blue-100 text-blue-700', 'Sosyal': 'bg-green-100 text-green-700', 'Toplantı': 'bg-yellow-100 text-yellow-700' }

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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapasite</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                  <input type="date" value={form.dateStr} onChange={e => setForm(f => ({ ...f, dateStr: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saat Aralığı</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={form.timeStart} onChange={e => setForm(f => ({ ...f, timeStart: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    <span className="text-slate-400 font-medium shrink-0">–</span>
                    <input type="time" value={form.timeEnd} onChange={e => setForm(f => ({ ...f, timeEnd: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konum</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary-600" />
                <span className="text-sm font-medium text-slate-700">Yayınla</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                  {saving ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Ekle')}
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

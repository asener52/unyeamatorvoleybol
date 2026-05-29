import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { supabase, uploadFile } from '../../lib/supabase'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const CATEGORIES = ['Duyuru', 'Başarı', 'Turnuva', 'Üyelik', 'Antrenman', 'Genel']
const EMPTY_FORM = { title: '', summary: '', content: '', category: 'Genel', imageUrl: '', published: false }

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy', { locale: tr }) } catch { return '' }
}

export default function ManageNews() {
  const [params] = useSearchParams()
  const { docs, loading } = useCollection('news')
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setImgPreview(''); setImgFile(null); setShowForm(true) }

  function openEdit(doc) {
    setForm({ title: doc.title, summary: doc.summary || '', content: doc.content || '', category: doc.category || 'Genel', imageUrl: doc.imageUrl || '', published: doc.published ?? false })
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
      if (imgFile) imageUrl = await uploadFile('news', imgFile.name, imgFile)
      const data = { ...form, imageUrl }
      if (editId) await updateDocument('news', editId, data)
      else await addDocument('news', data)
      setShowForm(false)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu haberi silmek istediğinizden emin misiniz?')) return
    await deleteDocument('news', id)
  }

  async function togglePublish(doc) {
    await updateDocument('news', doc.id, { published: !doc.published })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Haberler</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} haber</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Yeni Haber
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">{editId ? 'Haberi Düzenle' : 'Yeni Haber'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Özet</label>
                <textarea rows={2} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label>
                <textarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                      className="w-4 h-4 rounded text-primary-600" />
                    <span className="text-sm font-medium text-slate-700">Yayınla</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kapak Görseli</label>
                <div className="flex items-start gap-3">
                  <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors">
                    <FaImage size={14} /> Dosya Seç
                    <input type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </label>
                  {imgPreview && <img src={imgPreview} alt="" className="h-16 w-24 object-cover rounded-lg border" />}
                </div>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="ya da URL yapıştırın"
                  className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
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
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz haber eklenmemiş.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{d.title}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{d.category}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{formatDate(d.createdAt)}</td>
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

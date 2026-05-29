import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage } from 'react-icons/fa'

const EMPTY_FORM = { title: '', subtitle: '', imageUrl: '', published: false, order: 0 }

export default function ManageSlider() {
  const [params] = useSearchParams()
  const { docs, loading } = useCollection('sliders', 'order', 20)
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState('')

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setImgPreview(''); setImgFile(null); setShowForm(true) }

  function openEdit(doc) {
    setForm({ title: doc.title || '', subtitle: doc.subtitle || '', imageUrl: doc.imageUrl || '', published: doc.published ?? false, order: doc.order ?? 0 })
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
      if (imgFile) imageUrl = await uploadFile('sliders', imgFile.name, imgFile)
      const data = { ...form, imageUrl }
      if (editId) await updateDocument('sliders', editId, data)
      else await addDocument('sliders', data)
      setShowForm(false)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu slider kaydını silmek istediğinizden emin misiniz?')) return
    await deleteDocument('sliders', id)
  }

  async function togglePublish(doc) {
    await updateDocument('sliders', doc.id, { published: !doc.published })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Slider Yönetimi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ana sayfa slider görsellerini yönetin</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Yeni Slide
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">{editId ? 'Slide Düzenle' : 'Yeni Slide'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt Başlık</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sıra</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Görsel</label>
                <div className="flex items-start gap-3 mb-2">
                  <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors">
                    <FaImage size={14} /> Dosya Seç
                    <input type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </label>
                  {imgPreview && <img src={imgPreview} alt="" className="h-16 w-28 object-cover rounded-lg border" />}
                </div>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="ya da URL yapıştırın"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz slide eklenmemiş.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(d => (
            <div key={d.id} className="bg-white rounded-2xl overflow-hidden shadow border border-slate-100 hover:shadow-md transition-shadow">
              <div className="relative h-36 overflow-hidden bg-slate-100">
                {d.imageUrl ? (
                  <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400"><FaImage size={32} /></div>
                )}
                <button onClick={() => togglePublish(d)}
                  className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${d.published ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {d.published ? <><FaEye size={10} /> Yayında</> : <><FaEyeSlash size={10} /> Taslak</>}
                </button>
              </div>
              <div className="p-4">
                <div className="font-bold text-slate-800 text-sm truncate mb-0.5">{d.title}</div>
                {d.subtitle && <div className="text-slate-500 text-xs truncate">{d.subtitle}</div>}
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => openEdit(d)} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><FaTrash size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

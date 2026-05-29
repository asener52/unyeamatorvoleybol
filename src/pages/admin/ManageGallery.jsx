import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage, FaUpload } from 'react-icons/fa'

export default function ManageGallery() {
  const { docs, loading } = useCollection('gallery')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgUrl, setImgUrl] = useState('')
  const [imgPreview, setImgPreview] = useState('')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file); setImgPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let url = imgUrl
      if (imgFile) url = await uploadFile('gallery', imgFile.name, imgFile)
      if (!url) { alert('Görsel seçin veya URL girin'); setSaving(false); return }
      await addDocument('gallery', { title, url, published })
      setShowForm(false); setTitle(''); setImgFile(null); setImgUrl(''); setImgPreview(''); setPublished(true)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return
    await deleteDocument('gallery', id)
  }

  async function togglePublish(doc) {
    await updateDocument('gallery', doc.id, { published: !doc.published })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Galeri</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} fotoğraf</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Fotoğraf Ekle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">Fotoğraf Ekle</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık (isteğe bağlı)</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Görsel *</label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors overflow-hidden">
                  {imgPreview ? (
                    <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FaUpload className="text-slate-400 text-2xl mx-auto mb-2" />
                      <span className="text-slate-500 text-sm">Dosya seçmek için tıklayın</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                </label>
                <input value={imgUrl} onChange={e => { setImgUrl(e.target.value); setImgPreview(e.target.value) }}
                  placeholder="ya da görsel URL yapıştırın"
                  className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600" />
                <span className="text-sm font-medium text-slate-700">Yayınla</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                  {saving ? 'Yükleniyor...' : 'Ekle'}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz fotoğraf eklenmemiş.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {docs.map(d => (
            <div key={d.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {d.url ? (
                <img src={d.url} alt={d.title || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300"><FaImage size={32} /></div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <button onClick={() => togglePublish(d)} className={`p-2 rounded-full ${d.published ? 'bg-green-500' : 'bg-slate-500'} text-white hover:scale-110 transition-transform`}>
                  {d.published ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                </button>
                <button onClick={() => handleDelete(d.id)} className="p-2 rounded-full bg-red-500 text-white hover:scale-110 transition-transform">
                  <FaTrash size={14} />
                </button>
              </div>
              {d.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{d.title}</div>
              )}
              {!d.published && (
                <div className="absolute top-2 left-2 bg-slate-700/80 text-white text-xs px-2 py-0.5 rounded">Taslak</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

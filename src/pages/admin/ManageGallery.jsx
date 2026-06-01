import { useState } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage, FaUpload, FaVideo, FaPlay } from 'react-icons/fa'

function getYoutubeThumbnail(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

export default function ManageGallery() {
  const { docs, loading } = useCollection('gallery')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('image')
  const [imgFile, setImgFile] = useState(null)
  const [imgUrl, setImgUrl] = useState('')
  const [imgPreview, setImgPreview] = useState('')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setTitle(''); setType('image'); setImgFile(null); setImgUrl(''); setImgPreview(''); setPublished(true)
  }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file); setImgPreview(URL.createObjectURL(file))
  }

  function handleUrlChange(val) {
    setImgUrl(val)
    if (type === 'video') {
      const thumb = getYoutubeThumbnail(val)
      setImgPreview(thumb || val)
    } else {
      setImgPreview(val)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let url = imgUrl
      if (type === 'image' && imgFile) url = await uploadFile('gallery', imgFile.name, imgFile)
      if (!url) { alert('Görsel/video seçin veya URL girin'); setSaving(false); return }
      await addDocument('gallery', { title, url, type, published })
      setShowForm(false); resetForm()
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return
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
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} öğe</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Medya Ekle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">Medya Ekle</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Tür seçimi */}
              <div className="grid grid-cols-2 gap-2">
                {[['image', FaImage, 'Fotoğraf'], ['video', FaVideo, 'Video']].map(([val, Icon, label]) => (
                  <button key={val} type="button" onClick={() => { setType(val); setImgUrl(''); setImgPreview(''); setImgFile(null) }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${type === val ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık (isteğe bağlı)</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              {type === 'image' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Görsel *</label>
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors overflow-hidden">
                    {imgPreview ? <img src={imgPreview} alt="" className="w-full h-full object-cover" /> : (
                      <div className="text-center"><FaUpload className="text-slate-400 text-2xl mx-auto mb-2" /><span className="text-slate-500 text-sm">Dosya seçmek için tıklayın</span></div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </label>
                  <input value={imgUrl} onChange={e => handleUrlChange(e.target.value)} placeholder="ya da görsel URL yapıştırın"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video URL * (YouTube veya doğrudan link)</label>
                  <input value={imgUrl} onChange={e => handleUrlChange(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  {imgPreview && (
                    <div className="mt-2 relative rounded-xl overflow-hidden">
                      <img src={imgPreview} alt="" className="w-full h-36 object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <FaPlay className="text-white text-3xl" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
                <span className="text-sm font-medium text-slate-700">Yayınla</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
                  {saving ? 'Yükleniyor...' : 'Ekle'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
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
        <div className="text-center py-16 text-slate-400">Henüz medya eklenmemiş.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {docs.map(d => {
            const isVideo = d.type === 'video'
            const thumb = isVideo ? getYoutubeThumbnail(d.url) : null
            return (
              <div key={d.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {isVideo ? (
                  thumb ? <img src={thumb} alt={d.title || ''} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300"><FaVideo size={32} /></div>
                ) : (
                  d.url ? <img src={d.url} alt={d.title || ''} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300"><FaImage size={32} /></div>
                )}
                {isVideo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"><FaPlay className="text-white ml-0.5" size={14} /></div></div>}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button onClick={() => togglePublish(d)} className={`p-2 rounded-full ${d.published ? 'bg-green-500' : 'bg-slate-500'} text-white hover:scale-110 transition-transform`}>
                    {d.published ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="p-2 rounded-full bg-red-500 text-white hover:scale-110 transition-transform"><FaTrash size={14} /></button>
                </div>
                {d.title && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{d.title}</div>}
                {!d.published && <div className="absolute top-2 left-2 bg-slate-700/80 text-white text-xs px-2 py-0.5 rounded">Taslak</div>}
                {isVideo && <div className="absolute top-2 right-2 bg-red-600/80 text-white text-xs px-2 py-0.5 rounded">Video</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

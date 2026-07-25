import { useState, useEffect, useRef } from 'react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage, FaUpload, FaVideo, FaPlay, FaGlobeAmericas, FaGripVertical, FaSave, FaImages } from 'react-icons/fa'

function getYoutubeThumbnail(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}
function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}
function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)
}
function detectUrlType(url) {
  if (!url) return null
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'video'
  if (isDirectVideo(url)) return 'video'
  if (isImageUrl(url)) return 'image'
  return null
}

function UrlPreview({ url, mediaType }) {
  if (!url) return null
  if (mediaType === 'video') {
    const ytThumb = getYoutubeThumbnail(url)
    if (ytThumb) return (
      <div className="relative rounded-xl overflow-hidden mt-2 h-36">
        <img src={ytThumb} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <FaPlay className="text-white text-3xl drop-shadow" />
        </div>
        <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold">YouTube</span>
      </div>
    )
    if (isDirectVideo(url)) return (
      <video src={url} controls preload="metadata" className="w-full rounded-xl mt-2 max-h-48">
        Tarayıcınız video desteklemiyor.
      </video>
    )
    return null
  }
  // image
  return (
    <div className="mt-2 rounded-xl overflow-hidden h-36">
      <img src={url} alt="" className="w-full h-full object-cover"
        onError={e => { e.currentTarget.parentElement.style.display = 'none' }} />
    </div>
  )
}

export default function ManageGallery() {
  const { docs, loading } = useCollection('gallery', 'order', 200, true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('image')
  const [imgFile, setImgFile] = useState(null)
  const [imgUrl, setImgUrl] = useState('')
  const [imgPreview, setImgPreview] = useState('')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState('')
  const [bulkPublished, setBulkPublished] = useState(true)
  const bulkInputRef = useRef(null)

  // Sürükle-bırak sıralama
  const [ordered, setOrdered] = useState([])
  const [orderDirty, setOrderDirty] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const dragIdx = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => { setOrdered(docs); setOrderDirty(false) }, [docs])

  function onDragStart(e, i) { dragIdx.current = i; e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e, i) { e.preventDefault(); setDragOver(i) }
  function onDragLeave() { setDragOver(null) }
  function onDrop(e, i) {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === i) { setDragOver(null); return }
    const next = [...ordered]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    setOrdered(next)
    setOrderDirty(true)
    dragIdx.current = null
    setDragOver(null)
  }
  async function saveOrder() {
    setSavingOrder(true)
    try {
      await Promise.all(ordered.map((d, i) =>
        updateDocument('gallery', d.id, { order: i + 1, title: d.title, url: d.url, type: d.type, published: d.published })
      ))
      setOrderDirty(false)
    } catch (err) { alert('Sıra kaydedilemedi: ' + err.message) }
    finally { setSavingOrder(false) }
  }

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
    // Panoramik seçildiyse otomatik tip algılamayı atla
    if (type !== 'panoramic') {
      const detected = detectUrlType(val)
      if (detected && detected !== type) setType(detected)
    }
    setImgPreview(val)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let url = imgUrl
      if (imgFile) url = await uploadFile('gallery', imgFile.name, imgFile)
      if (!url) { alert('Görsel/video seçin veya URL girin'); setSaving(false); return }
      const nextOrder = ordered.length > 0 ? Math.max(...ordered.map(d => d.order || 0)) + 1 : 1
      await addDocument('gallery', { title, url, type, published, order: nextOrder })
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
    setSelectedIds(ids => ids.filter(item => item !== id))
  }

  async function handleBulkUpload(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBulkUploading(true)
    const failed = []
    let uploadedCount = 0
    try {
      let nextOrder = ordered.length > 0 ? Math.max(...ordered.map(d => d.order || 0)) + 1 : 1
      for (let i = 0; i < files.length; i += 1) {
        setBulkProgress(`${i + 1}/${files.length}`)
        const file = files[i]
        try {
          const url = await uploadFile('gallery', file.name, file)
          const titleFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
          await addDocument('gallery', {
            title: titleFromFile, url, type: 'image', published: bulkPublished, order: nextOrder++,
          })
          uploadedCount += 1
        } catch (err) {
          failed.push(`${file.name}: ${err.message}`)
        }
      }
    } finally {
      setBulkUploading(false)
      setBulkProgress('')
    }
    if (failed.length) {
      alert(`${uploadedCount} görsel yüklendi, ${failed.length} görsel yüklenemedi:\n\n${failed.join('\n')}`)
    }
  }

  function toggleSelected(id) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return
    if (!confirm(`${selectedIds.length} galeri öğesi silinecek. Devam etmek istiyor musunuz?`)) return
    setSaving(true)
    try {
      await Promise.all(selectedIds.map(id => deleteDocument('gallery', id)))
      setSelectedIds([])
    } catch (err) {
      alert('Toplu silme sırasında hata: ' + err.message)
    } finally {
      setSaving(false)
    }
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
        <div className="flex gap-2 flex-wrap justify-end">
          <input ref={bulkInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBulkUpload} />
          {ordered.length > 0 && (
            <button onClick={() => setSelectedIds(selectedIds.length === ordered.length ? [] : ordered.map(d => d.id))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium text-sm">
              {selectedIds.length === ordered.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
          )}
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} disabled={saving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm">
              <FaTrash size={13} /> Seçilenleri Sil ({selectedIds.length})
            </button>
          )}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer">
            <input type="checkbox" checked={bulkPublished}
              onChange={e => setBulkPublished(e.target.checked)}
              disabled={bulkUploading}
              className="w-4 h-4 rounded text-green-600" />
            <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Yüklenenleri yayınla</span>
          </label>
          <button onClick={() => bulkInputRef.current?.click()} disabled={bulkUploading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm">
            <FaImages size={14} /> {bulkUploading ? `Yükleniyor ${bulkProgress}` : 'Toplu Görsel Ekle'}
          </button>
          {orderDirty && (
            <button onClick={saveOrder} disabled={savingOrder}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-primary-900 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
              <FaSave size={13} /> {savingOrder ? 'Kaydediliyor...' : 'Sırayı Kaydet'}
            </button>
          )}
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            <FaPlus size={13} /> Medya Ekle
          </button>
        </div>
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
              <div className="grid grid-cols-3 gap-2">
                {[['image', FaImage, 'Fotoğraf'], ['panoramic', FaGlobeAmericas, '360° / Pano'], ['video', FaVideo, 'Video']].map(([val, Icon, label]) => (
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

              {(type === 'image' || type === 'panoramic') ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Görsel *</label>

                  {/* Dosya yükleme */}
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors overflow-hidden">
                    {imgFile ? (
                      <img src={imgPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <FaUpload className="text-slate-400 text-2xl mx-auto mb-2" />
                        <span className="text-slate-500 text-sm font-medium">Dosya yüklemek için tıklayın</span>
                        <p className="text-slate-400 text-xs mt-1">JPG, PNG, WebP, GIF</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { handleImgChange(e); setImgUrl('') }} />
                  </label>

                  {/* Ya da URL */}
                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="mx-3 text-xs text-slate-400 font-medium">ya da URL girin</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <input
                    value={imgUrl}
                    onChange={e => { handleUrlChange(e.target.value); if (e.target.value) setImgFile(null) }}
                    placeholder="https://example.com/gorsel.jpg"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {imgUrl && <UrlPreview url={imgUrl} mediaType="image" />}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Video *</label>

                  {/* Video dosya yükleme */}
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors overflow-hidden">
                    {imgFile ? (
                      <div className="flex items-center gap-2 text-primary-700">
                        <FaVideo size={18} />
                        <span className="text-sm font-medium truncate max-w-[220px]">{imgFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FaUpload className="text-slate-400 text-2xl mx-auto mb-2" />
                        <span className="text-slate-500 text-sm font-medium">Video dosyası yükleyin</span>
                        <p className="text-slate-400 text-xs mt-1">MP4, WebM, MOV</p>
                      </div>
                    )}
                    <input type="file" accept="video/*" className="hidden" onChange={e => { handleImgChange(e); setImgUrl('') }} />
                  </label>

                  {/* Ya da URL */}
                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="mx-3 text-xs text-slate-400 font-medium">ya da URL girin</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <input
                    value={imgUrl}
                    onChange={e => { handleUrlChange(e.target.value); if (e.target.value) setImgFile(null) }}
                    placeholder="https://youtube.com/watch?v=... veya MP4 linki"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {imgUrl && <UrlPreview url={imgUrl} mediaType="video" />}
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
        <>
          {orderDirty && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">Sıralamanız değişti. Kaydetmek için "Sırayı Kaydet" butonuna tıklayın.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ordered.map((d, i) => {
              const isVideo = d.type === 'video'
              const thumb = isVideo ? getYoutubeThumbnail(d.url) : null
              return (
                <div
                  key={d.id}
                  draggable
                  onDragStart={e => onDragStart(e, i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, i)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-100 transition-all ${
                    selectedIds.includes(d.id) ? 'border-red-500 ring-2 ring-red-200' : dragOver === i ? 'border-primary-500 scale-105' : 'border-slate-200'
                  }`}
                >
                  <label className="absolute top-2 right-2 z-20 w-6 h-6 rounded bg-white/95 shadow flex items-center justify-center cursor-pointer">
                    <input type="checkbox" checked={selectedIds.includes(d.id)}
                      onChange={() => toggleSelected(d.id)}
                      className="w-4 h-4 rounded text-red-600" />
                  </label>
                  {isVideo ? (
                    thumb ? <img src={thumb} alt={d.title || ''} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300"><FaVideo size={32} /></div>
                  ) : (
                    d.url ? <img src={d.url} alt={d.title || ''} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300"><FaImage size={32} /></div>
                  )}
                  {/* Sıra no */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <FaGripVertical size={9} className="text-slate-300" /> {d.order || i + 1}
                  </div>
                  {isVideo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"><FaPlay className="text-white ml-0.5" size={14} /></div></div>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <button onClick={() => togglePublish(d)} className={`p-2 rounded-full ${d.published ? 'bg-green-500' : 'bg-slate-500'} text-white hover:scale-110 transition-transform`}>
                      {d.published ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 rounded-full bg-red-500 text-white hover:scale-110 transition-transform"><FaTrash size={14} /></button>
                  </div>
                  {d.title && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{d.title}</div>}
                  {!d.published && <div className="absolute top-10 right-2 bg-slate-700/80 text-white text-xs px-2 py-0.5 rounded">Taslak</div>}
                  {isVideo && <div className="absolute bottom-6 right-2 bg-red-600/80 text-white text-xs px-2 py-0.5 rounded">Video</div>}
                  {d.type === 'panoramic' && <div className="absolute bottom-6 right-2 bg-primary-700/90 text-white text-xs px-2 py-0.5 rounded font-semibold">360°</div>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

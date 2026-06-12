import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { uploadFile } from '../../lib/supabase'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaImage, FaGripVertical, FaSave } from 'react-icons/fa'

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

  // Sürükle-bırak sıralaması için yerel kopya
  const [ordered, setOrdered] = useState([])
  const [orderDirty, setOrderDirty] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => {
    setOrdered(docs)
    setOrderDirty(false)
  }, [docs])

  /* ── Drag & Drop ─────────────────────────────── */
  function onDragStart(i) {
    dragIdx.current = i
  }
  function onDragOver(e, i) {
    e.preventDefault()
    dragOverIdx.current = i
  }
  function onDrop() {
    const from = dragIdx.current
    const to = dragOverIdx.current
    if (from === null || to === null || from === to) return
    const next = [...ordered]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrdered(next)
    setOrderDirty(true)
    dragIdx.current = null
    dragOverIdx.current = null
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await Promise.all(
        ordered.map((doc, i) => updateDocument('sliders', doc.id, { order: i }))
      )
      setOrderDirty(false)
    } catch (err) {
      alert('Sıralama kaydedilemedi: ' + err.message)
    } finally {
      setSavingOrder(false)
    }
  }

  /* ── Form helpers ────────────────────────────── */
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
      else {
        // Yeni slide'ı en sona ekle
        const maxOrder = ordered.length > 0 ? Math.max(...ordered.map(d => d.order ?? 0)) : -1
        await addDocument('sliders', { ...data, order: maxOrder + 1 })
      }
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
          <p className="text-slate-500 text-sm mt-0.5">Ana sayfa slider görsellerini yönetin · sürükleyerek sıralayın</p>
        </div>
        <div className="flex items-center gap-2">
          {orderDirty && (
            <button
              onClick={saveOrder}
              disabled={savingOrder}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <FaSave size={13} /> {savingOrder ? 'Kaydediliyor...' : 'Sırayı Kaydet'}
            </button>
          )}
          <button onClick={openNew} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            <FaPlus size={13} /> Yeni Slide
          </button>
        </div>
      </div>

      {/* Sürükle ipucu */}
      {!loading && ordered.length > 1 && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <FaGripVertical size={11} />
          <span>Kartları sürükleyerek sırasını değiştirebilirsiniz. Değişiklik sonrası <strong className="text-slate-600">Sırayı Kaydet</strong> butonuna basın.</span>
        </div>
      )}

      {/* Form modal */}
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt Başlık</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary-600" />
                  <span className="text-sm font-medium text-slate-700">Yayınla</span>
                </label>
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
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
      ) : ordered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz slide eklenmemiş.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordered.map((d, i) => (
            <div
              key={d.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={onDrop}
              className="bg-white rounded-2xl overflow-hidden shadow border border-slate-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing active:ring-2 active:ring-primary-400 select-none"
            >
              <div className="relative h-36 overflow-hidden bg-slate-100">
                {d.imageUrl ? (
                  <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400"><FaImage size={32} /></div>
                )}
                {/* Sıra numarası */}
                <span className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
                <button onClick={() => togglePublish(d)}
                  className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${d.published ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {d.published ? <><FaEye size={10} /> Yayında</> : <><FaEyeSlash size={10} /> Taslak</>}
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <FaGripVertical size={13} className="text-slate-300 shrink-0" />
                  <div className="font-bold text-slate-800 text-sm truncate">{d.title}</div>
                </div>
                {d.subtitle && <div className="text-slate-500 text-xs truncate pl-5">{d.subtitle}</div>}
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

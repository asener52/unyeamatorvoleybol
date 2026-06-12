import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTimes, FaMinus, FaCalendarAlt } from 'react-icons/fa'

const EMPTY_FORM = {
  question: '',
  options: [{ id: 'o1', label: '' }, { id: 'o2', label: '' }],
  published: false,
  visibility: 'public',
  event_id: '',
  event_title: '',
}

function genId() { return 'o' + Math.random().toString(36).slice(2, 7) }

export default function ManagePolls() {
  const [params] = useSearchParams()
  const { docs, loading } = useCollection('polls')
  const [showForm, setShowForm] = useState(params.get('new') === '1')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase
      .from('events')
      .select('id, title, date, type')
      .eq('published', true)
      .order('date', { ascending: false })
      .limit(50)
      .then(({ data }) => setEvents(data || []))
  }, [])

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }

  function openEdit(doc) {
    setForm({
      question: doc.question,
      options: doc.options || [],
      published: doc.published ?? false,
      visibility: doc.visibility || 'public',
      event_id: doc.event_id || '',
      event_title: doc.event_title || '',
    })
    setEditId(doc.id); setShowForm(true)
  }

  function addOption() {
    setForm(f => ({ ...f, options: [...f.options, { id: genId(), label: '' }] }))
  }

  function removeOption(id) {
    setForm(f => ({ ...f, options: f.options.filter(o => o.id !== id) }))
  }

  function updateOption(id, label) {
    setForm(f => ({ ...f, options: f.options.map(o => o.id === id ? { ...o, label } : o) }))
  }

  function handleEventChange(e) {
    const selectedId = e.target.value
    const selectedEvent = events.find(ev => ev.id === selectedId)
    setForm(f => ({
      ...f,
      event_id: selectedId,
      event_title: selectedEvent ? selectedEvent.title : '',
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.options.length < 2) { alert('En az 2 seçenek gerekli'); return }
    setSaving(true)
    try {
      const data = {
        question: form.question,
        options: form.options,
        published: form.published,
        visibility: form.visibility,
        votes: {},
        ...(form.event_id ? { event_id: form.event_id, event_title: form.event_title } : { event_id: null, event_title: null }),
      }
      if (editId) await updateDocument('polls', editId, data)
      else await addDocument('polls', data)
      setShowForm(false)
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu anketi silmek istediğinizden emin misiniz?')) return
    await deleteDocument('polls', id)
  }

  async function togglePublish(doc) {
    await updateDocument('polls', doc.id, { published: !doc.published })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Anketler</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} anket</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <FaPlus size={13} /> Yeni Anket
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-slate-800 text-lg">{editId ? 'Anketi Düzenle' : 'Yeni Anket'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Soru *</label>
                <textarea required rows={2} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Seçenekler *</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm w-5 text-center">{i + 1}.</span>
                      <input
                        required
                        value={opt.label}
                        onChange={e => updateOption(opt.id, e.target.value)}
                        placeholder={`Seçenek ${i + 1}`}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {form.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(opt.id)} className="text-red-400 hover:text-red-600 p-1.5">
                          <FaMinus size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {form.options.length < 6 && (
                  <button type="button" onClick={addOption}
                    className="mt-2 flex items-center gap-1 text-primary-600 hover:text-primary-800 text-sm font-medium">
                    <FaPlus size={11} /> Seçenek Ekle
                  </button>
                )}
              </div>

              {/* Etkinlik Bağlantısı */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                  <FaCalendarAlt size={12} /> Etkinlik Bağlantısı <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
                </label>
                <select
                  value={form.event_id}
                  onChange={handleEventChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">— Etkinlik seçme</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.date ? `(${ev.date})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary-600" />
                  <span className="text-sm font-medium text-slate-700">Yayınla</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Görünürlük:</span>
                  <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="public">Herkese Açık</option>
                    <option value="members">Sadece Üyeler</option>
                  </select>
                </div>
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
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz anket eklenmemiş.</div>
      ) : (
        <div className="space-y-3">
          {docs.map(d => {
            const totalVotes = Object.values(d.votes || {}).reduce((a, b) => a + b, 0)
            return (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{d.question}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-slate-400">{d.options?.length || 0} seçenek · {totalVotes} oy</p>
                    {d.event_title && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        <FaCalendarAlt size={9} /> {d.event_title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => togglePublish(d)}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${d.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.published ? <><FaEye size={10} /> Yayında</> : <><FaEyeSlash size={10} /> Taslak</>}
                  </button>
                  <button onClick={() => openEdit(d)} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><FaTrash size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

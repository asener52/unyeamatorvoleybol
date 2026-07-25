import { useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useCollection } from '../../hooks/useFirestore'
import { FaTrash, FaVolleyballBall, FaPhone, FaUser, FaTimes, FaClock, FaSort, FaSortUp, FaSortDown, FaChartBar, FaCalendarAlt, FaStar, FaShieldAlt, FaChevronDown, FaChevronRight } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  try { return format(new Date(dateStr), 'd MMM yyyy', { locale: tr }) } catch { return dateStr }
}

const STATUS_CONFIG = {
  bekliyor:    { label: 'Bekliyor',      cls: 'bg-yellow-100 text-yellow-700' },
  as_kadro:    { label: 'As Kadro',      cls: 'bg-green-100 text-green-700' },
  yedek_kadro: { label: 'Yedek Kadro',  cls: 'bg-blue-100 text-blue-700' },
  reddedildi:  { label: 'Reddedildi',   cls: 'bg-red-100 text-red-700' },
  iptal:       { label: 'İptal Edildi', cls: 'bg-slate-100 text-slate-500' },
}

function RosterSection({ title, players, icon, color, emptyText }) {
  return (
    <div className="mt-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-2 ${color}`}>
        {icon}
        <span className="font-bold text-sm">{title}</span>
        <span className="ml-auto font-bold text-sm">{players.length} kişi</span>
      </div>
      {players.length === 0 ? (
        <p className="text-xs text-slate-400 px-2 py-1">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{p.name}</div>
                <a href={`tel:${p.phone}`} className="text-xs text-primary-600 hover:text-primary-800">
                  {p.phone}
                </a>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                p.type === 'oyuncu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {p.type === 'oyuncu' ? 'Oyuncu' : 'Seyirci'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ManageMatchRequests() {
  const { docs, loading } = useCollection('match_requests', 'created_at', 500)
  const [filter, setFilter] = useState('hepsi')
  const [view, setView] = useState('liste') // 'liste' | 'mac'
  const [sortField, setSortField] = useState('event_date')
  const [sortDir, setSortDir] = useState('asc')

  // Sütun sırası — localStorage'dan yükle
  const DEFAULT_COLS = ['name', 'phone', 'type', 'match', 'event_date', 'created_at', 'status']
  const [colOrder, setColOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mmr_col_order')) || DEFAULT_COLS } catch { return DEFAULT_COLS }
  })
  const dragColIdx = useRef(null)
  const dragOverColIdx = useRef(null)

  function onColDragStart(e, i) { dragColIdx.current = i; e.dataTransfer.effectAllowed = 'move' }
  function onColDragOver(e, i) { e.preventDefault(); dragOverColIdx.current = i }
  function onColDrop(e, i) {
    e.preventDefault()
    const from = dragColIdx.current
    if (from === null || from === i) return
    const next = [...colOrder]
    const [col] = next.splice(from, 1)
    next.splice(i, 0, col)
    setColOrder(next)
    localStorage.setItem('mmr_col_order', JSON.stringify(next))
    dragColIdx.current = null
  }
  const [openGroups, setOpenGroups] = useState({})

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const toggleGroup = useCallback(key => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  async function setStatus(id, status) {
    await supabase.from('match_requests').update({ status }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Bu talebi silmek istediğinizden emin misiniz?')) return
    await supabase.from('match_requests').delete().eq('id', id)
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <FaSort size={10} className="text-slate-300 ml-1 inline" />
    return sortDir === 'asc'
      ? <FaSortUp size={10} className="text-primary-600 ml-1 inline" />
      : <FaSortDown size={10} className="text-primary-600 ml-1 inline" />
  }

  const filtered = useMemo(() => {
    let list = docs.filter(d => (d.event_date || '') >= today)
    if (filter !== 'hepsi') list = list.filter(d => d.type === filter || d.status === filter)
    list = [...list].sort((a, b) => {
      let va, vb
      if (sortField === 'event_date') {
        va = a.event_date || ''
        vb = b.event_date || ''
      } else if (sortField === 'created_at') {
        va = a.created_at || a.createdAt || ''
        vb = b.created_at || b.createdAt || ''
      } else {
        va = a[sortField] || ''
        vb = b[sortField] || ''
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return list
  }, [docs, filter, sortField, sortDir])

  // Maç bazlı gruplama: sadece gelecek etkinlikler
  const matchGroups = useMemo(() => {
    const map = {}
    docs.filter(d => (d.event_date || '') >= today).forEach(d => {
      const key = d.event_id || '__no_event__'
      if (!map[key]) map[key] = {
        eventId: String(key),
        title: d.event_title || 'Belirtilmemiş',
        date: d.event_date || '',
        as_kadro: [],
        yedek_kadro: [],
        bekliyor: [],
        reddedildi: [],
        iptal: [],
      }
      const status = d.status || 'bekliyor'
      if (map[key][status] !== undefined) map[key][status].push(d)
      else map[key].bekliyor.push(d)
    })
    return Object.values(map).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [docs])

  // Sadece mevcut/gelecek maçlardaki talepler
  const currentDocs = useMemo(() => docs.filter(d => (d.event_date || '') >= today), [docs, today])
  const asKadroCount    = currentDocs.filter(d => d.status === 'as_kadro').length
  const yedekKadroCount = currentDocs.filter(d => d.status === 'yedek_kadro').length
  const bekliyorCount   = currentDocs.filter(d => d.status === 'bekliyor').length
  const reddedildiCount = currentDocs.filter(d => d.status === 'reddedildi').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Maç Katılım Talepleri</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} talep</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('liste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'liste' ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Liste
          </button>
          <button onClick={() => setView('mac')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${view === 'mac' ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            <FaChartBar size={11} /> Maç Bazlı
          </button>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600">{asKadroCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">As Kadro</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-blue-600">{yedekKadroCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Yedek Kadro</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-yellow-600">{bekliyorCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-red-500">{reddedildiCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Reddedildi</div>
        </div>
      </div>

      {view === 'mac' ? (
        /* Maç bazlı görünüm */
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />)}</div>
          ) : matchGroups.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Talep bulunamadı.</div>
          ) : matchGroups.map((m, i) => {
            const key = m.date + '_' + i
            const isOpen = !!openGroups[key]
            const total = m.as_kadro.length + m.yedek_kadro.length + m.bekliyor.length + m.reddedildi.length + m.iptal.length
            return (
              <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Accordion başlık — tıklanabilir */}
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-slate-800 text-base truncate">{m.title}</div>
                    {m.date && (
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <FaCalendarAlt size={10} /> {formatEventDate(m.date)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 text-xs font-semibold">
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{m.as_kadro.length} As</span>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{m.yedek_kadro.length} Yedek</span>
                    <span className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">{m.bekliyor.length} Bekliyor</span>
                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{total} Toplam</span>
                  </div>
                  {isOpen
                    ? <FaChevronDown size={13} className="text-slate-400 shrink-0" />
                    : <FaChevronRight size={13} className="text-slate-400 shrink-0" />
                  }
                </button>

                {/* Accordion içerik */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    {m.eventId !== '__no_event__' && m.as_kadro.length > 0 && (
                      <div className="flex justify-end pt-4">
                        <Link to={`/admin/mac-kadrosu?event=${encodeURIComponent(m.eventId)}`}
                          className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                          <FaVolleyballBall size={13} /> Maç Kadrosu Oluştur / Yayınla
                        </Link>
                      </div>
                    )}
                    <RosterSection
                      title="As Kadro"
                      players={m.as_kadro}
                      icon={<FaStar size={13} className="text-green-600" />}
                      color="bg-green-50 text-green-800"
                      emptyText="Henüz as kadroya alınan yok."
                    />
                    <RosterSection
                      title="Yedek Kadro"
                      players={m.yedek_kadro}
                      icon={<FaShieldAlt size={13} className="text-blue-600" />}
                      color="bg-blue-50 text-blue-800"
                      emptyText="Henüz yedek kadroya alınan yok."
                    />
                    {m.bekliyor.length > 0 && (
                      <RosterSection
                        title="Bekleyenler"
                        players={m.bekliyor}
                        icon={<FaClock size={13} className="text-yellow-600" />}
                        color="bg-yellow-50 text-yellow-800"
                        emptyText=""
                      />
                    )}
                    {m.reddedildi.length > 0 && (
                      <RosterSection
                        title="Reddedilenler"
                        players={m.reddedildi}
                        icon={<FaTimes size={13} className="text-red-500" />}
                        color="bg-red-50 text-red-700"
                        emptyText=""
                      />
                    )}
                    {m.iptal.length > 0 && (
                      <RosterSection
                        title="İptal Edilenler"
                        players={m.iptal}
                        icon={<FaTimes size={13} className="text-slate-400" />}
                        color="bg-slate-50 text-slate-500"
                        emptyText=""
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Liste görünümü */
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'hepsi',       label: 'Tümü' },
              { key: 'oyuncu',      label: 'Oyuncular' },
              { key: 'seyirci',     label: 'Seyirciler' },
              { key: 'as_kadro',    label: 'As Kadro' },
              { key: 'yedek_kadro', label: 'Yedek Kadro' },
              { key: 'bekliyor',    label: 'Bekleyenler' },
              { key: 'reddedildi',  label: 'Reddedilenler' },
              { key: 'iptal',       label: 'İptal Edilenler' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === key ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Talep bulunamadı.</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {colOrder.map((col, i) => {
                      const base = 'px-4 py-3 font-semibold text-slate-600 text-left select-none cursor-grab active:cursor-grabbing whitespace-nowrap'
                      if (col === 'name') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={base}>
                          ⠿ Ad Soyad
                        </th>
                      )
                      if (col === 'phone') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={base}>
                          ⠿ Telefon
                        </th>
                      )
                      if (col === 'type') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={`${base} hidden sm:table-cell`}>
                          ⠿ Tür
                        </th>
                      )
                      if (col === 'match') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={`${base} hidden lg:table-cell`}>
                          ⠿ Maç
                        </th>
                      )
                      if (col === 'event_date') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={`${base} hidden md:table-cell`} onClick={() => toggleSort('event_date')}>
                          ⠿ Etkinlik Tarihi <SortIcon field="event_date" />
                        </th>
                      )
                      if (col === 'created_at') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={`${base} hidden xl:table-cell`} onClick={() => toggleSort('created_at')}>
                          ⠿ Başvuru Tarihi <SortIcon field="created_at" />
                        </th>
                      )
                      if (col === 'status') return (
                        <th key={col} draggable onDragStart={e => onColDragStart(e, i)} onDragOver={e => onColDragOver(e, i)} onDrop={e => onColDrop(e, i)} className={base}>
                          ⠿ Durum
                        </th>
                      )
                      return null
                    })}
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(d => {
                    const status = d.status || 'bekliyor'
                    const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG.bekliyor
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        {colOrder.map(col => {
                          if (col === 'name') return (
                            <td key={col} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FaUser size={12} className="text-slate-300" />
                                <span className="font-medium text-slate-800">{d.name}</span>
                              </div>
                            </td>
                          )
                          if (col === 'phone') return (
                            <td key={col} className="px-4 py-3">
                              <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 transition-colors">
                                <FaPhone size={11} /> {d.phone}
                              </a>
                            </td>
                          )
                          if (col === 'type') return (
                            <td key={col} className="px-4 py-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                                d.type === 'oyuncu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {d.type === 'oyuncu' ? <FaVolleyballBall size={10} /> : '👁'}
                                {d.type === 'oyuncu' ? 'Oyuncu' : 'Seyirci'}
                              </span>
                            </td>
                          )
                          if (col === 'match') return (
                            <td key={col} className="px-4 py-3 hidden lg:table-cell">
                              {d.event_title
                                ? <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{d.event_title}</span>
                                : <span className="text-slate-300 text-xs">—</span>
                              }
                            </td>
                          )
                          if (col === 'event_date') return (
                            <td key={col} className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell font-medium">
                              {d.event_date ? formatEventDate(d.event_date) : <span className="text-slate-300">—</span>}
                            </td>
                          )
                          if (col === 'created_at') return (
                            <td key={col} className="px-4 py-3 text-slate-400 text-xs hidden xl:table-cell">
                              {formatDate(d.created_at || d.createdAt)}
                            </td>
                          )
                          if (col === 'status') return (
                            <td key={col} className="px-4 py-3">
                              <select
                                value={status}
                                onChange={e => setStatus(d.id, e.target.value)}
                                className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 ${cls}`}
                              >
                                <option value="bekliyor">Bekliyor</option>
                                <option value="as_kadro">As Kadro</option>
                                <option value="yedek_kadro">Yedek Kadro</option>
                                <option value="reddedildi">Reddedildi</option>
                                <option value="iptal">İptal Edildi</option>
                              </select>
                            </td>
                          )
                          return null
                        })}
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(d.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <FaTrash size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

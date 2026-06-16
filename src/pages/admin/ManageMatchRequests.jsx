import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useCollection } from '../../hooks/useFirestore'
import { FaTrash, FaVolleyballBall, FaPhone, FaUser, FaCheck, FaTimes, FaClock, FaSort, FaSortUp, FaSortDown, FaChartBar, FaCalendarAlt } from 'react-icons/fa'
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
  bekliyor:   { label: 'Bekliyor',   icon: FaClock, cls: 'bg-yellow-100 text-yellow-700' },
  onaylandi:  { label: 'Onaylandı',  icon: FaCheck, cls: 'bg-green-100 text-green-700' },
  reddedildi: { label: 'Reddedildi', icon: FaTimes, cls: 'bg-red-100 text-red-700' },
}

export default function ManageMatchRequests() {
  const { docs, loading } = useCollection('match_requests', 'created_at', 500)
  const [filter, setFilter] = useState('hepsi')
  const [view, setView] = useState('liste') // 'liste' | 'mac'
  const [sortField, setSortField] = useState('event_date')
  const [sortDir, setSortDir] = useState('asc')

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
    let list = filter === 'hepsi' ? docs : docs.filter(d => d.type === filter || d.status === filter)
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

  // Maç bazlı istatistikler
  const matchStats = useMemo(() => {
    const map = {}
    docs.forEach(d => {
      const key = d.event_id || '__no_event__'
      if (!map[key]) map[key] = { title: d.event_title || 'Belirtilmemiş', date: d.event_date || '', total: 0, onaylandi: 0, bekliyor: 0, reddedildi: 0, oyuncu: 0, seyirci: 0 }
      map[key].total++
      map[key][d.status || 'bekliyor']++
      map[key][d.type || 'oyuncu']++
    })
    return Object.values(map).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [docs])

  const oyuncuCount   = docs.filter(d => d.type === 'oyuncu').length
  const seyirciCount  = docs.filter(d => d.type === 'seyirci').length
  const bekliyorCount = docs.filter(d => d.status === 'bekliyor').length
  const onaylandiCount= docs.filter(d => d.status === 'onaylandi').length

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
          <div className="text-2xl font-extrabold text-primary-700">{oyuncuCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Oyuncu</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-slate-700">{seyirciCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Seyirci</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-yellow-600">{bekliyorCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600">{onaylandiCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Onaylandı</div>
        </div>
      </div>

      {view === 'mac' ? (
        /* Maç bazlı görünüm */
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Maç Bazlı Başvuru İstatistikleri</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl" />)}</div>
          ) : matchStats.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Talep bulunamadı.</div>
          ) : (
            <div className="space-y-3">
              {matchStats.map((m, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="font-bold text-slate-800">{m.title}</div>
                      {m.date && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <FaCalendarAlt size={10} /> {formatEventDate(m.date)}
                        </div>
                      )}
                    </div>
                    <span className="text-lg font-extrabold text-primary-700 shrink-0">{m.total} başvuru</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="font-bold text-blue-700 text-base">{m.oyuncu}</div>
                      <div className="text-blue-500">Oyuncu</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2">
                      <div className="font-bold text-purple-700 text-base">{m.seyirci}</div>
                      <div className="text-purple-500">Seyirci</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="font-bold text-green-700 text-base">{m.onaylandi}</div>
                      <div className="text-green-500">Onaylandı</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                      <div className="font-bold text-yellow-700 text-base">{m.bekliyor}</div>
                      <div className="text-yellow-500">Bekliyor</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <div className="font-bold text-red-700 text-base">{m.reddedildi}</div>
                      <div className="text-red-500">Reddedildi</div>
                    </div>
                  </div>
                  {m.total > 0 && (
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="bg-green-400 h-full transition-all" style={{ width: `${(m.onaylandi / m.total) * 100}%` }} />
                      <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(m.bekliyor / m.total) * 100}%` }} />
                      <div className="bg-red-400 h-full transition-all" style={{ width: `${(m.reddedildi / m.total) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Liste görünümü */
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'hepsi', label: 'Tümü' },
              { key: 'oyuncu', label: 'Oyuncular' },
              { key: 'seyirci', label: 'Seyirciler' },
              { key: 'bekliyor', label: 'Bekleyenler' },
              { key: 'onaylandi', label: 'Onaylananlar' },
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
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Ad Soyad</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Telefon</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Tür</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Maç</th>
                    <th
                      className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell cursor-pointer select-none"
                      onClick={() => toggleSort('event_date')}
                    >
                      Etkinlik Tarihi <SortIcon field="event_date" />
                    </th>
                    <th
                      className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell cursor-pointer select-none"
                      onClick={() => toggleSort('created_at')}
                    >
                      Başvuru Tarihi <SortIcon field="created_at" />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(d => {
                    const status = d.status || 'bekliyor'
                    const { label, icon: Icon, cls } = STATUS_CONFIG[status] || STATUS_CONFIG.bekliyor
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FaUser size={12} className="text-slate-300" />
                            <span className="font-medium text-slate-800">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 transition-colors">
                            <FaPhone size={11} /> {d.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                            d.type === 'oyuncu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {d.type === 'oyuncu' ? <FaVolleyballBall size={10} /> : '👁'}
                            {d.type === 'oyuncu' ? 'Oyuncu' : 'Seyirci'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {d.event_title
                            ? <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{d.event_title}</span>
                            : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell font-medium">
                          {d.event_date ? formatEventDate(d.event_date) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden xl:table-cell">
                          {formatDate(d.created_at || d.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={status}
                            onChange={e => setStatus(d.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400 ${cls}`}
                          >
                            <option value="bekliyor">Bekliyor</option>
                            <option value="onaylandi">Onaylandı</option>
                            <option value="reddedildi">Reddedildi</option>
                          </select>
                        </td>
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

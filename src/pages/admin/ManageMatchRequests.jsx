import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCollection } from '../../hooks/useFirestore'
import { FaTrash, FaVolleyballBall, FaPhone, FaUser, FaCheck, FaTimes, FaClock } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}

const STATUS_CONFIG = {
  bekliyor:  { label: 'Bekliyor',  icon: FaClock, cls: 'bg-yellow-100 text-yellow-700' },
  onaylandi: { label: 'Onaylandı', icon: FaCheck,  cls: 'bg-green-100 text-green-700' },
  reddedildi:{ label: 'Reddedildi',icon: FaTimes,  cls: 'bg-red-100 text-red-700' },
}

export default function ManageMatchRequests() {
  const { docs, loading } = useCollection('match_requests', 'created_at', 200)
  const [filter, setFilter] = useState('hepsi')

  async function setStatus(id, status) {
    await supabase.from('match_requests').update({ status }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Bu talebi silmek istediğinizden emin misiniz?')) return
    await supabase.from('match_requests').delete().eq('id', id)
  }

  const filtered = filter === 'hepsi' ? docs : docs.filter(d => d.type === filter || d.status === filter)

  const oyuncuCount  = docs.filter(d => d.type === 'oyuncu').length
  const seyirciCount = docs.filter(d => d.type === 'seyirci').length
  const bekliyorCount= docs.filter(d => d.status === 'bekliyor').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Maç Katılım Talepleri</h1>
          <p className="text-slate-500 text-sm mt-0.5">{docs.length} talep</p>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
      </div>

      {/* Filtre */}
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Tarih</th>
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
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{formatDate(d.createdAt)}</td>
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
    </div>
  )
}

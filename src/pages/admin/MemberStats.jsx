import { useMemo, useState } from 'react'
import { useCollection } from '../../hooks/useFirestore'
import { supabase } from '../../lib/supabase'
import { FaVolleyballBall, FaUser, FaChevronDown, FaChevronRight, FaStar, FaShieldAlt, FaClock, FaTimes, FaMedal, FaSearch } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(d) {
  if (!d) return '—'
  try { return format(new Date(d), 'd MMM yyyy', { locale: tr }) } catch { return d }
}

const STATUS_CONFIG = {
  as_kadro:    { label: 'As Kadro',    cls: 'bg-green-100 text-green-700',  icon: <FaStar size={10} /> },
  yedek_kadro: { label: 'Yedek Kadro', cls: 'bg-blue-100 text-blue-700',   icon: <FaShieldAlt size={10} /> },
  bekliyor:    { label: 'Bekliyor',    cls: 'bg-yellow-100 text-yellow-700', icon: <FaClock size={10} /> },
  reddedildi:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-700',      icon: <FaTimes size={10} /> },
  iptal:       { label: 'İptal',       cls: 'bg-slate-100 text-slate-500',  icon: <FaTimes size={10} /> },
}

export default function MemberStats() {
  const { docs: requests, loading } = useCollection('match_requests', 'created_at', 1000)
  const { docs: members } = useCollection('members', 'name', 500)
  const [openMember, setOpenMember] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('total') // 'total' | 'asKadro' | 'name'
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const memberById = useMemo(() => Object.fromEntries(members.map(member => [member.id, member])), [members])

  async function changeStatus(requestId, status) {
    setUpdatingStatus(requestId)
    const { error } = await supabase.from('match_requests').update({ status }).eq('id', requestId)
    setUpdatingStatus(null)
    if (error) alert('Durum güncellenemedi: ' + error.message)
  }

  // Üye başına istatistik hesapla
  const stats = useMemo(() => {
    const map = {}
    requests.forEach(r => {
      const id = r.member_id
      if (!id) return
      if (!map[id]) {
        const canonicalName = memberById[id]?.name
        const requestName = r.name || ''
        map[id] = {
          id,
          name: canonicalName || (requestName.includes('@') ? 'İsimsiz Üye' : requestName) || '—',
          phone: r.phone || '',
          total: 0,
          asKadro: 0,
          yedekKadro: 0,
          bekliyor: 0,
          reddedildi: 0,
          iptal: 0,
          matches: [],
        }
      }
      const s = r.status || 'bekliyor'
      map[id].total++
      if (s === 'as_kadro')    map[id].asKadro++
      else if (s === 'yedek_kadro') map[id].yedekKadro++
      else if (s === 'bekliyor')    map[id].bekliyor++
      else if (s === 'reddedildi')  map[id].reddedildi++
      else if (s === 'iptal')       map[id].iptal++
      map[id].matches.push({
        id: r.id,
        eventTitle: r.event_title || 'Belirtilmemiş',
        eventDate: r.event_date || '',
        status: s,
      })
    })

    // Tarihe göre sırala (yeniden eskiye)
    Object.values(map).forEach(m => {
      m.matches.sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''))
      // Katılım oranı: (as + yedek) / (as + yedek + bekliyor + reddedildi) [iptal sayılmaz]
      const eligible = m.asKadro + m.yedekKadro + m.bekliyor + m.reddedildi
      m.attendRate = eligible > 0 ? Math.round(((m.asKadro + m.yedekKadro) / eligible) * 100) : null
    })

    return Object.values(map)
  }, [requests, memberById])

  const sorted = useMemo(() => {
    let list = stats.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    )
    if (sortKey === 'total')   list.sort((a, b) => b.total - a.total)
    if (sortKey === 'asKadro') list.sort((a, b) => b.asKadro - a.asKadro)
    if (sortKey === 'name')    list.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    return list
  }, [stats, search, sortKey])

  const totals = useMemo(() => ({
    requests: requests.length,
    asKadro: requests.filter(r => r.status === 'as_kadro').length,
    yedek: requests.filter(r => r.status === 'yedek_kadro').length,
    members: stats.length,
  }), [requests, stats])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Üye Maç İstatistikleri</h1>
        <p className="text-slate-500 text-sm mt-0.5">Üyelerin tüm maçlardaki katılım geçmişi</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-primary-700">{totals.members}</div>
          <div className="text-xs text-slate-500 mt-0.5">Katılan Üye</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-slate-700">{totals.requests}</div>
          <div className="text-xs text-slate-500 mt-0.5">Toplam Başvuru</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600">{totals.asKadro}</div>
          <div className="text-xs text-slate-500 mt-0.5">As Kadro Onayı</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-blue-600">{totals.yedek}</div>
          <div className="text-xs text-slate-500 mt-0.5">Yedek Kadro Onayı</div>
        </div>
      </div>

      {/* Arama + sıralama */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İsim veya telefon ara..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'total',   label: 'Başvuru Sayısı' },
            { key: 'asKadro', label: 'As Kadro' },
            { key: 'name',    label: 'İsim' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                sortKey === key ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Kayıt bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(m => {
            const isOpen = openMember === m.id
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Satır başlığı */}
                <button
                  type="button"
                  onClick={() => setOpenMember(isOpen ? null : m.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <FaUser size={13} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.phone}</div>
                  </div>

                  {/* Stat rozetleri */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span title="Toplam başvuru" className="hidden sm:flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                      <FaVolleyballBall size={9} /> {m.total}
                    </span>
                    <span title="As Kadro" className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                      <FaStar size={9} /> {m.asKadro}
                    </span>
                    <span title="Yedek Kadro" className="hidden sm:flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                      <FaShieldAlt size={9} /> {m.yedekKadro}
                    </span>
                    {m.attendRate !== null && (
                      <span title="Katılım oranı" className={`hidden md:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                        m.attendRate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        m.attendRate >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <FaMedal size={9} /> %{m.attendRate}
                      </span>
                    )}
                  </div>

                  {isOpen
                    ? <FaChevronDown size={12} className="text-slate-400 shrink-0" />
                    : <FaChevronRight size={12} className="text-slate-400 shrink-0" />
                  }
                </button>

                {/* Maç geçmişi */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <div className="flex gap-4 mb-3 flex-wrap text-xs font-semibold">
                      <span className="text-slate-500">Toplam başvuru: <span className="text-slate-800">{m.total}</span></span>
                      <span className="text-green-700">As Kadro: {m.asKadro}</span>
                      <span className="text-blue-700">Yedek: {m.yedekKadro}</span>
                      <span className="text-yellow-700">Bekliyor: {m.bekliyor}</span>
                      <span className="text-red-600">Reddedildi: {m.reddedildi}</span>
                      <span className="text-slate-400">İptal: {m.iptal}</span>
                      {m.attendRate !== null && (
                        <span className="text-slate-500">Katılım oranı: <span className={
                          m.attendRate >= 70 ? 'text-emerald-600' :
                          m.attendRate >= 40 ? 'text-amber-600' : 'text-red-500'
                        }>{m.attendRate}%</span></span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {m.matches.map(match => {
                        const cfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.bekliyor
                        return (
                          <div key={match.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2 border-b border-slate-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-slate-700">{match.eventTitle}</span>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">{formatDate(match.eventDate)}</span>
                            <select value={match.status}
                              onChange={e => changeStatus(match.id, e.target.value)}
                              disabled={updatingStatus === match.id}
                              aria-label={`${match.eventTitle} kadro durumu`}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border-0 font-semibold shrink-0 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 ${cfg.cls}`}>
                              <option value="bekliyor">Bekliyor</option>
                              <option value="as_kadro">As Kadro</option>
                              <option value="yedek_kadro">Yedek Kadro</option>
                              <option value="reddedildi">Reddedildi</option>
                              <option value="iptal">İptal</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

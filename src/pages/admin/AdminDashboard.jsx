import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { FaNewspaper, FaImages, FaCalendarAlt, FaPoll, FaPhotoVideo, FaArrowRight, FaVolleyballBall, FaCheck, FaClock, FaTimes, FaUsers } from 'react-icons/fa'

const sections = [
  { label: 'Haberler', col: 'news', icon: FaNewspaper, to: '/admin/haberler', color: 'bg-blue-500' },
  { label: 'Slider', col: 'sliders', icon: FaPhotoVideo, to: '/admin/slider', color: 'bg-indigo-500' },
  { label: 'Galeri', col: 'gallery', icon: FaImages, to: '/admin/galeri', color: 'bg-purple-500' },
  { label: 'Etkinlikler', col: 'events', icon: FaCalendarAlt, to: '/admin/etkinlikler', color: 'bg-green-500' },
  { label: 'Anketler', col: 'polls', icon: FaPoll, to: '/admin/anketler', color: 'bg-orange-500' },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState({})
  const [matchStats, setMatchStats] = useState(null)

  useEffect(() => {
    sections.forEach(async ({ col }) => {
      try {
        const { count } = await supabase
          .from(col)
          .select('*', { count: 'exact', head: true })
        setCounts(prev => ({ ...prev, [col]: count ?? 0 }))
      } catch {
        setCounts(prev => ({ ...prev, [col]: '—' }))
      }
    })

    // Maç istatistiklerini çek
    async function fetchMatchStats() {
      try {
        const { data } = await supabase
          .from('match_requests')
          .select('status, type, event_id, event_title, event_date')
        if (!data) return
        const total = data.length
        const onaylandi = data.filter(d => d.status === 'onaylandi').length
        const bekliyor = data.filter(d => d.status === 'bekliyor').length
        const reddedildi = data.filter(d => d.status === 'reddedildi').length
        const oyuncu = data.filter(d => d.type === 'oyuncu').length
        const seyirci = data.filter(d => d.type === 'seyirci').length

        // Etkinlik bazlı istatistikler
        const eventMap = {}
        data.forEach(d => {
          const key = d.event_id || '__none__'
          if (!eventMap[key]) eventMap[key] = { title: d.event_title || 'Belirtilmemiş', date: d.event_date || '', total: 0, onaylandi: 0, bekliyor: 0 }
          eventMap[key].total++
          if (d.status === 'onaylandi') eventMap[key].onaylandi++
          if (d.status === 'bekliyor') eventMap[key].bekliyor++
        })
        const topEvents = Object.values(eventMap)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          .slice(0, 5)

        setMatchStats({ total, onaylandi, bekliyor, reddedildi, oyuncu, seyirci, topEvents })
      } catch {}
    }
    fetchMatchStats()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">Gösterge Paneli</h1>
        <p className="text-slate-500 mt-1">Tüm içerikleri buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {sections.map(({ label, col, icon: Icon, to, color }) => (
          <Link key={col} to={to}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className={`inline-flex p-3 rounded-xl ${color} mb-3`}>
              <Icon className="text-white" size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mb-0.5">
              {counts[col] !== undefined ? counts[col] : (
                <span className="text-slate-300 text-lg animate-pulse">...</span>
              )}
            </div>
            <div className="text-sm text-slate-500 flex items-center justify-between">
              {label}
              <FaArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Maç İstatistikleri */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <FaVolleyballBall className="text-primary-600" size={18} />
            Maç Katılım İstatistikleri
          </h2>
          <Link to="/admin/mac-talepleri" className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1">
            Tümünü Gör <FaArrowRight size={10} />
          </Link>
        </div>

        {!matchStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
              {[
                { label: 'Toplam', value: matchStats.total, color: 'text-slate-800', bg: 'bg-slate-50', icon: FaUsers },
                { label: 'Onaylandı', value: matchStats.onaylandi, color: 'text-green-700', bg: 'bg-green-50', icon: FaCheck },
                { label: 'Bekliyor', value: matchStats.bekliyor, color: 'text-yellow-700', bg: 'bg-yellow-50', icon: FaClock },
                { label: 'Reddedildi', value: matchStats.reddedildi, color: 'text-red-700', bg: 'bg-red-50', icon: FaTimes },
                { label: 'Oyuncu', value: matchStats.oyuncu, color: 'text-blue-700', bg: 'bg-blue-50', icon: FaVolleyballBall },
                { label: 'Seyirci', value: matchStats.seyirci, color: 'text-purple-700', bg: 'bg-purple-50', icon: null },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center border border-white shadow-sm`}>
                  <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {matchStats.topEvents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600">Etkinlik Bazlı Durum</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {matchStats.topEvents.map((ev, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">{ev.title}</div>
                        {ev.date && <div className="text-xs text-slate-400">{ev.date}</div>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs font-semibold">
                        <span className="text-slate-500">{ev.total} başvuru</span>
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{ev.onaylandi} onay</span>
                        <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">{ev.bekliyor} bekliyor</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-700 mb-4">Hızlı İşlemler</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ label, icon: Icon, to }) => (
          <Link key={label} to={`${to}?new=1`}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all group">
            <Icon className="text-slate-400 group-hover:text-primary-600 transition-colors" size={20} />
            <span className="text-slate-600 group-hover:text-primary-700 font-medium text-sm">
              Yeni {label.slice(0, -2) || label} ekle
            </span>
            <FaArrowRight size={11} className="ml-auto text-slate-300 group-hover:text-primary-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

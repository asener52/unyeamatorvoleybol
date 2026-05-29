import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { FaNewspaper, FaImages, FaCalendarAlt, FaPoll, FaPhotoVideo, FaArrowRight } from 'react-icons/fa'

const sections = [
  { label: 'Haberler', col: 'news', icon: FaNewspaper, to: '/admin/haberler', color: 'bg-blue-500' },
  { label: 'Slider', col: 'sliders', icon: FaPhotoVideo, to: '/admin/slider', color: 'bg-indigo-500' },
  { label: 'Galeri', col: 'gallery', icon: FaImages, to: '/admin/galeri', color: 'bg-purple-500' },
  { label: 'Etkinlikler', col: 'events', icon: FaCalendarAlt, to: '/admin/etkinlikler', color: 'bg-green-500' },
  { label: 'Anketler', col: 'polls', icon: FaPoll, to: '/admin/anketler', color: 'bg-orange-500' },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState({})

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

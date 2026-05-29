import { Link } from 'react-router-dom'
import { FaCalendarAlt, FaTag } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return format(d, 'd MMMM yyyy', { locale: tr })
}

export default function NewsCard({ news, featured = false }) {
  const dateStr = formatDate(news.createdAt)

  if (featured) {
    return (
      <Link to={`/haberler/${news.id}`} className="group block relative overflow-hidden rounded-2xl shadow-xl">
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img
            src={news.imageUrl || 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=70'}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 p-6">
          {news.category && (
            <span className="inline-block bg-gold-500 text-primary-900 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase">
              {news.category}
            </span>
          )}
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-gold-300 transition-colors">
            {news.title}
          </h2>
          <p className="text-blue-200 text-sm line-clamp-2">{news.summary}</p>
          <div className="flex items-center gap-2 mt-3 text-blue-300 text-xs">
            <FaCalendarAlt /> {dateStr}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/haberler/${news.id}`} className="group flex bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow duration-300 border border-slate-100">
      <div className="w-36 sm:w-44 shrink-0 overflow-hidden">
        <img
          src={news.imageUrl || 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=70'}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col justify-between min-w-0">
        <div>
          {news.category && (
            <span className="text-xs text-primary-600 font-semibold uppercase flex items-center gap-1 mb-1">
              <FaTag size={10} /> {news.category}
            </span>
          )}
          <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
            {news.title}
          </h3>
          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{news.summary}</p>
        </div>
        <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs">
          <FaCalendarAlt /> {dateStr}
        </div>
      </div>
    </Link>
  )
}

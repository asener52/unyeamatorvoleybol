import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return format(d, 'd MMMM yyyy, EEEE', { locale: tr })
}

const typeColors = {
  'Turnuva': 'bg-red-100 text-red-700',
  'Antrenman': 'bg-blue-100 text-blue-700',
  'Sosyal': 'bg-green-100 text-green-700',
  'Toplantı': 'bg-yellow-100 text-yellow-700',
}

export default function EventCard({ event }) {
  const dateStr = formatDate(event.date)
  const typeClass = typeColors[event.type] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 border border-slate-100 flex flex-col">
      {event.imageUrl && (
        <div className="overflow-hidden rounded-t-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full object-contain"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bold text-slate-800 text-lg leading-snug">{event.title}</h3>
          {event.type && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${typeClass}`}>
              {event.type}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>
        )}

        <div className="space-y-1.5 text-sm text-slate-500">
          {dateStr && (
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-primary-500 shrink-0" size={13} />
              <span>{dateStr}</span>
            </div>
          )}
          {event.time && (
            <div className="flex items-center gap-2">
              <FaClock className="text-primary-500 shrink-0" size={13} />
              <span>{event.time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary-500 shrink-0" size={13} />
              <span>{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2">
              <FaUsers className="text-primary-500 shrink-0" size={13} />
              <span>Kapasite: {event.capacity} kişi</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

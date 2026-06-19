import EventCard from '../components/EventCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaEnvelope } from 'react-icons/fa'

export default function EventsPage() {
  const { docs, loading } = usePublishedCollection('events', 200, 'date', true)
  const { settings } = useSettings()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  // İki hafta sonunun tarihi (bu hafta + önümüzdeki hafta)
  const weekStart = new Date(now)
  const dow = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1))
  weekStart.setHours(0, 0, 0, 0)
  const twoWeeksEnd = new Date(weekStart)
  twoWeeksEnd.setDate(weekStart.getDate() + 14)
  const endStr = twoWeeksEnd.toISOString().slice(0, 10)

  const upcoming = docs.filter(e => {
    const d = (e.date || '').slice(0, 10)
    return d >= todayStr && d < endStr
  })
  const past = docs.filter(e => {
    const d = (e.date || '').slice(0, 10)
    return d < todayStr
  }).reverse() // en yeniden eskiye

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Etkinlikler" subtitle="Takvim" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <p className="text-center text-slate-400 py-20 text-lg">Henüz etkinlik yok.</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Yaklaşan Etkinlikler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-400 mb-4 border-b border-slate-200 pb-2">Geçmiş Etkinlikler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
                {past.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA: etkinlik hakkında bilgi almak isteyenler için */}
      {settings?.contact?.email && (
        <div className="mt-14 bg-primary-50 border border-primary-100 rounded-2xl p-6 text-center">
          <p className="text-slate-600 text-sm mb-3">Etkinlikler hakkında bilgi almak için bize ulaşın</p>
          <a href={`mailto:${settings.contact.email}`}
            className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-900 font-semibold text-sm transition-colors">
            <FaEnvelope size={14} /> {settings.contact.email}
          </a>
        </div>
      )}
    </div>
  )
}

import EventCard from '../components/EventCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'

export default function EventsPage() {
  const { docs, loading } = usePublishedCollection('events', 50)

  const now = new Date()
  const upcoming = docs.filter(e => {
    const d = e.date?.toDate ? e.date.toDate() : new Date(e.date)
    return d >= now
  })
  const past = docs.filter(e => {
    const d = e.date?.toDate ? e.date.toDate() : new Date(e.date)
    return d < now
  })

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
    </div>
  )
}

import EventCard from '../components/EventCard'
import SectionHeader from '../components/SectionHeader'
import { useStaticCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaEnvelope, FaCalendarAlt } from 'react-icons/fa'
import { format, startOfWeek, addWeeks, isBefore, isAfter, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

function getWeekStart(refDate) {
  return startOfWeek(refDate, { weekStartsOn: 1 }) // Pazartesi
}

function weekLabel(weekStart, currentWeekStart) {
  const diff = Math.round((weekStart - currentWeekStart) / (7 * 24 * 3600 * 1000))
  if (diff === 0) return 'Bu Hafta'
  if (diff === 1) return 'Gelecek Hafta'
  if (diff === -1) return 'Geçen Hafta'
  return format(weekStart, "'Hafta:' d MMMM", { locale: tr })
}

export default function EventsPage() {
  const { docs, loading } = useStaticCollection('events', 200, 'date', true)
  const { settings } = useSettings()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentWeekStart = getWeekStart(now)

  // Tüm etkinlikleri haftalara göre grupla
  const weekMap = {}
  docs.forEach(e => {
    const dateStr = (e.date || '').slice(0, 10)
    if (!dateStr) return
    const d = parseISO(dateStr)
    const ws = getWeekStart(d)
    const key = ws.toISOString().slice(0, 10)
    if (!weekMap[key]) weekMap[key] = { weekStart: ws, events: [] }
    weekMap[key].events.push(e)
  })

  // Haftalara ayır: bu hafta ve sonrası = yaklaşan, öncesi = geçmiş
  const upcomingWeeks = Object.values(weekMap)
    .filter(w => !isBefore(w.weekStart, currentWeekStart))
    .sort((a, b) => a.weekStart - b.weekStart)

  const pastWeeks = Object.values(weekMap)
    .filter(w => isBefore(w.weekStart, currentWeekStart))
    .sort((a, b) => b.weekStart - a.weekStart) // en yeniden eskiye

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
          {/* Yaklaşan — Haftalık */}
          {upcomingWeeks.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-slate-700 mb-6 border-b border-slate-200 pb-2">
                Yaklaşan Etkinlikler
              </h2>
              <div className="space-y-8">
                {upcomingWeeks.map(({ weekStart, events }) => {
                  const weekEnd = addWeeks(weekStart, 1)
                  const label = weekLabel(weekStart, currentWeekStart)
                  const dateRange = `${format(weekStart, 'd MMM', { locale: tr })} – ${format(addWeeks(weekStart, 1), 'd MMM', { locale: tr })}`
                  return (
                    <div key={weekStart.toISOString()}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                          label === 'Bu Hafta'
                            ? 'bg-primary-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <FaCalendarAlt size={10} /> {label}
                        </span>
                        <span className="text-xs text-slate-400">{dateRange}</span>
                        <span className="text-xs font-semibold text-slate-400">{events.length} etkinlik</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map(e => <EventCard key={e.id} event={e} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Geçmiş — Haftalık */}
          {pastWeeks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-400 mb-6 border-b border-slate-200 pb-2">
                Geçmiş Etkinlikler
              </h2>
              <div className="space-y-8 opacity-60">
                {pastWeeks.map(({ weekStart, events }) => {
                  const label = weekLabel(weekStart, currentWeekStart)
                  const dateRange = `${format(weekStart, 'd MMM', { locale: tr })} – ${format(addWeeks(weekStart, 1), 'd MMM', { locale: tr })}`
                  return (
                    <div key={weekStart.toISOString()}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">
                          <FaCalendarAlt size={10} /> {label}
                        </span>
                        <span className="text-xs text-slate-400">{dateRange}</span>
                        <span className="text-xs font-semibold text-slate-400">{events.length} etkinlik</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map(e => <EventCard key={e.id} event={e} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

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

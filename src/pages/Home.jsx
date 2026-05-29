import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import NewsCard from '../components/NewsCard'
import EventCard from '../components/EventCard'
import PollCard from '../components/PollCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaArrowRight, FaVolleyballBall } from 'react-icons/fa'

export default function Home() {
  const { docs: news, loading: newsLoading } = usePublishedCollection('news', 4)
  const { docs: events, loading: eventsLoading } = usePublishedCollection('events', 4)
  const { docs: polls } = usePublishedCollection('polls', 1)
  const { settings } = useSettings()

  const featuredNews = news[0]
  const sideNews = news.slice(1, 4)
  const poll = polls[0] || null

  return (
    <div>
      <HeroSlider />

      {/* Stats bar */}
      {settings?.stats?.length > 0 && (
        <div className="bg-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {settings.stats.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <FaVolleyballBall className="text-gold-400 text-2xl shrink-0" />
                  <div>
                    <div className="font-extrabold text-2xl text-white">{s.value}</div>
                    <div className="text-blue-300 text-xs">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* News */}
        <section className="mb-14">
          <SectionHeader
            title="Son Haberler"
            subtitle="Haberler"
            action={
              <Link to="/haberler" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors">
                Tümü <FaArrowRight size={12} />
              </Link>
            }
          />
          {newsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />)}
            </div>
          ) : news.length === 0 ? (
            <p className="text-slate-400 text-center py-10">Henüz haber yok.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredNews && (
                <div className="lg:col-span-2">
                  <NewsCard news={featuredNews} featured />
                </div>
              )}
              <div className="space-y-4">
                {sideNews.map(n => <NewsCard key={n.id} news={n} />)}
              </div>
            </div>
          )}
        </section>

        {/* Events + Poll */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
          <section className="lg:col-span-2">
            <SectionHeader
              title="Yaklaşan Etkinlikler"
              subtitle="Etkinlikler"
              action={
                <Link to="/etkinlikler" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors">
                  Tümü <FaArrowRight size={12} />
                </Link>
              }
            />
            {eventsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-52 bg-slate-200 animate-pulse rounded-xl" />)}
              </div>
            ) : events.length === 0 ? (
              <p className="text-slate-400 text-center py-10">Yaklaşan etkinlik yok.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {events.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Güncel Anket" subtitle="Anket" />
            {poll ? (
              <>
                <PollCard poll={poll} />
                <Link to="/anketler" className="mt-4 flex items-center justify-center gap-1 text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors">
                  Diğer anketler <FaArrowRight size={12} />
                </Link>
              </>
            ) : (
              <p className="text-slate-400 text-center py-10">Aktif anket yok.</p>
            )}
          </section>
        </div>

        {/* CTA */}
        {settings?.ctaText && (
          <section className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-8 md:p-12 text-white text-center">
            <FaVolleyballBall className="text-gold-400 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">{settings.ctaTitle || 'Topluluğumuza Katılın!'}</h2>
            <p className="text-blue-200 mb-6 max-w-lg mx-auto">{settings.ctaText}</p>
            {settings.ctaEmail && (
              <a href={`mailto:${settings.ctaEmail}`}
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-primary-900 font-bold px-6 py-3 rounded-full transition-colors">
                Bilgi Al <FaArrowRight />
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

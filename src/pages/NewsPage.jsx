import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewsCard from '../components/NewsCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection, useStaticCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaArrowLeft, FaCalendarAlt, FaTag, FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMMM yyyy', { locale: tr }) } catch { return '' }
}

function NewsDetail({ id }) {
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('news').select('*').eq('id', id).single()
      .then(({ data }) => { setNews(data ? { ...data, imageUrl: data.image_url, createdAt: data.created_at } : null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <div className="h-8 bg-slate-200 animate-pulse rounded mb-6 w-48" />
      <div className="h-12 bg-slate-200 animate-pulse rounded mb-4" />
      <div className="h-80 bg-slate-200 animate-pulse rounded-2xl mb-8" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-slate-200 animate-pulse rounded" />)}
      </div>
    </div>
  )

  if (!news) return (
    <div className="text-center py-20">
      <p className="text-slate-500 text-lg">Haber bulunamadı.</p>
      <Link to="/haberler" className="mt-4 inline-flex items-center gap-2 text-primary-600 font-medium">
        <FaArrowLeft size={14} /> Haberlere dön
      </Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/haberler" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-6 font-medium transition-colors">
        <FaArrowLeft size={14} /> Haberlere Dön
      </Link>
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary-900 mb-4 leading-tight">{news.title}</h1>
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
        {news.category && (
          <span className="flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-semibold">
            <FaTag size={11} /> {news.category}
          </span>
        )}
        <span className="flex items-center gap-1"><FaCalendarAlt size={12} /> {formatDate(news.createdAt)}</span>
      </div>
      {news.imageUrl && (
        <img src={news.imageUrl} alt={news.title} className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8 shadow-lg" />
      )}
      {news.content ? (
        <div className="prose-content text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: news.content }} />
      ) : (
        <p className="text-slate-700 leading-relaxed text-lg">{news.summary}</p>
      )}
    </div>
  )
}

export default function NewsPage() {
  const { id } = useParams()
  const { docs: news, loading } = useStaticCollection('news', 50)
  const { settings } = useSettings()
  const social = settings?.social || {}
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  if (id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <NewsDetail id={id} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Haberler" subtitle="Tüm Haberler" />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : news.length === 0 ? (
        <p className="text-center text-slate-400 py-20 text-lg">Henüz haber yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {news.map(n => <NewsCard key={n.id} news={n} />)}
        </div>
      )}

      {activeSocials.length > 0 && (
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm mb-4">Haberleri sosyal medyada takip edin</p>
          <div className="flex justify-center gap-4">
            {activeSocials.map(([key, { Icon, href }]) => (
              <a key={key} href={href(social[key])} target="_blank" rel="noreferrer"
                className="text-primary-600 hover:text-gold-500 transition-colors text-2xl">
                <Icon />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

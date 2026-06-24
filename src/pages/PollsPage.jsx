import PollCard from '../components/PollCard'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection, useStaticCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok } from 'react-icons/fa'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

export default function PollsPage() {
  const { docs: polls, loading } = useStaticCollection('polls', 50)
  const { settings } = useSettings()
  const social = settings?.social || {}
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Anketler" subtitle="Görüşünüz Önemli" />
      <p className="text-slate-500 mb-8">Topluluğumuzla ilgili kararlar almamıza yardımcı olmak için anketlere katılın.</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : polls.length === 0 ? (
        <p className="text-center text-slate-400 py-20 text-lg">Aktif anket yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map(poll => <PollCard key={poll.id} poll={poll} />)}
        </div>
      )}

      {/* Sosyal medya takip daveti */}
      {activeSocials.length > 0 && (
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm mb-4">Bizi takip edin, anketlere ilk siz ulaşın</p>
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

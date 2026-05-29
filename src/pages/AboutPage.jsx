import { useSettings } from '../hooks/useSettings'
import { FaVolleyballBall, FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

export default function AboutPage() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}
      </div>
    )
  }

  const about = settings?.about || {}
  const team = settings?.team || []
  const contact = settings?.contact || {}
  const social = settings?.social || {}

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-14">
        <FaVolleyballBall className="text-gold-500 text-6xl mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-primary-900 mb-4">
          {about.title || 'Ünye Amatör Voleybolcular'}
        </h1>
        {about.description && (
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">{about.description}</p>
        )}
        {social && Object.values(social).some(Boolean) && (
          <div className="flex justify-center gap-4 mt-6">
            {Object.entries(SOCIAL_ICONS).filter(([key]) => social[key]).map(([key, { Icon, href }]) => (
              <a key={key} href={href(social[key])} target="_blank" rel="noreferrer"
                className="text-primary-600 hover:text-gold-500 transition-colors text-2xl">
                <Icon />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Values */}
      {about.values?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {about.values.map((v, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 text-center shadow border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <FaVolleyballBall className="text-primary-600 text-xl" />
              </div>
              <h3 className="font-bold text-primary-900 text-lg mb-2">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Story */}
      {about.story && (
        <section className="bg-primary-50 rounded-2xl p-8 mb-14 border border-primary-100">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-4">Hikayemiz</h2>
          <div className="text-slate-600 leading-relaxed whitespace-pre-line">{about.story}</div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-6">Ekibimiz</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="text-center">
                {member.img ? (
                  <img src={member.img} alt={member.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-primary-100 shadow" />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                    <span className="text-primary-600 font-bold text-2xl">{member.name?.[0]}</span>
                  </div>
                )}
                <div className="font-bold text-slate-800">{member.name}</div>
                <div className="text-sm text-primary-600">{member.role}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {(contact.address || contact.phone || contact.email) && (
        <section className="bg-white rounded-2xl p-8 shadow border border-slate-100">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-6">İletişim</h2>
          <div className="space-y-4 text-slate-600">
            {contact.address && (
              <div className="flex items-center gap-3"><FaMapMarkerAlt className="text-gold-500 shrink-0" />{contact.address}</div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3"><FaPhone className="text-gold-500 shrink-0" />{contact.phone}</div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3"><FaEnvelope className="text-gold-500 shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-primary-600">{contact.email}</a>
              </div>
            )}
          </div>
        </section>
      )}

      {!about.description && !about.story && team.length === 0 && (
        <p className="text-center text-slate-400 py-20 text-lg">
          Admin panelinden site ayarlarını düzenleyin.
        </p>
      )}
    </div>
  )
}

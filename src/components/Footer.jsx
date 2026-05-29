import { Link } from 'react-router-dom'
import {
  FaVolleyballBall,
  FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok,
  FaEnvelope, FaMapMarkerAlt, FaPhone
} from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

export default function Footer() {
  const { settings } = useSettings()
  const contact = settings?.contact || {}
  const social = settings?.social || {}
  const brand = settings?.brand || {}

  const siteName = brand.name || 'Ünye Amatör Voleybol Topluluğu'
  const tagline = brand.tagline || 'Spor Topluluğu'
  const copyright = brand.copyright || siteName

  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  return (
    <footer className="bg-primary-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaVolleyballBall className="text-gold-400 text-2xl" />
              <div>
                <div className="font-bold text-gold-400">{siteName}</div>
                <div className="text-xs text-blue-300">{tagline}</div>
              </div>
            </div>
            {settings?.about?.description && (
              <p className="text-blue-200 text-sm leading-relaxed line-clamp-3">
                {settings.about.description}
              </p>
            )}
            {activeSocials.length > 0 && (
              <div className="flex gap-3 mt-4">
                {activeSocials.map(([key, { Icon, href }]) => (
                  <a key={key} href={href(social[key])} target="_blank" rel="noreferrer"
                    className="text-blue-300 hover:text-gold-400 transition-colors">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/haberler', label: 'Haberler' },
                { to: '/etkinlikler', label: 'Etkinlikler' },
                { to: '/galeri', label: 'Galeri' },
                { to: '/anketler', label: 'Anketler' },
                { to: '/hakkimizda', label: 'Hakkımızda' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-blue-200 hover:text-gold-400 transition-colors">→ {label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          {(contact.address || contact.phone || contact.email) && (
            <div>
              <h3 className="font-semibold text-gold-400 mb-4">İletişim</h3>
              <ul className="space-y-3 text-sm text-blue-200">
                {contact.address && (
                  <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-gold-400 shrink-0" />{contact.address}</li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-2"><FaPhone className="text-gold-400 shrink-0" />{contact.phone}</li>
                )}
                {contact.email && (
                  <li className="flex items-center gap-2"><FaEnvelope className="text-gold-400 shrink-0" />{contact.email}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-primary-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-blue-400">
          <span>© {new Date().getFullYear()} {copyright}. Tüm hakları saklıdır.</span>
          <Link to="/admin" className="hover:text-gold-400 transition-colors">Yönetici Girişi</Link>
        </div>
      </div>
    </footer>
  )
}

import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { FaTimes, FaChevronLeft, FaChevronRight, FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok } from 'react-icons/fa'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

export default function GalleryPage() {
  const { docs: images, loading } = usePublishedCollection('gallery', 100)
  const { settings } = useSettings()
  const [lightbox, setLightbox] = useState(null)
  const social = settings?.social || {}
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  function prev() { setLightbox(i => (i - 1 + images.length) % images.length) }
  function next() { setLightbox(i => (i + 1) % images.length) }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Galeri" subtitle="Fotoğraflar" />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : images.length === 0 ? (
        <p className="text-center text-slate-400 py-20 text-lg">Henüz fotoğraf yok.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow hover:shadow-lg"
              onClick={() => setLightbox(idx)}>
              <img src={img.url || img.imageUrl} alt={img.title || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              {img.title && (
                <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-sm font-semibold">{img.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gold-400 z-10" onClick={() => setLightbox(null)}>
            <FaTimes size={28} />
          </button>
          <button className="absolute left-4 text-white hover:text-gold-400 z-10 p-2" onClick={e => { e.stopPropagation(); prev() }}>
            <FaChevronLeft size={32} />
          </button>
          <button className="absolute right-4 text-white hover:text-gold-400 z-10 p-2" onClick={e => { e.stopPropagation(); next() }}>
            <FaChevronRight size={32} />
          </button>
          <img
            src={images[lightbox]?.url || images[lightbox]?.imageUrl}
            alt={images[lightbox]?.title}
            className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          {images[lightbox]?.title && (
            <div className="absolute bottom-6 text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-full">
              {images[lightbox].title}
            </div>
          )}
        </div>
      )}

      {/* Sosyal medya — fotoğrafları sosyalde takip et */}
      {activeSocials.length > 0 && (
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm mb-4">Daha fazla fotoğraf için bizi takip edin</p>
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

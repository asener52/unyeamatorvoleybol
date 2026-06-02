import { useState, useRef, useEffect, useCallback } from 'react'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import {
  FaTimes, FaChevronLeft, FaChevronRight,
  FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok,
  FaGlobeAmericas
} from 'react-icons/fa'

const SOCIAL_ICONS = {
  facebook:  { Icon: FaFacebook,  href: v => v },
  instagram: { Icon: FaInstagram, href: v => v },
  youtube:   { Icon: FaYoutube,   href: v => v },
  twitter:   { Icon: FaTwitter,   href: v => v },
  whatsapp:  { Icon: FaWhatsapp,  href: v => `https://wa.me/${v.replace(/\D/g, '')}` },
  tiktok:    { Icon: FaTiktok,    href: v => v },
}

// ─── 360° Panoramik Viewer ─────────────────────────────────────────────────
function PanoramaViewer({ src }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startOffset, setStartOffset] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const autoRef = useRef(null)

  const maxOffset = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return 0
    return Math.max(0, imgRef.current.naturalWidth *
      (containerRef.current.clientHeight / imgRef.current.naturalHeight) -
      containerRef.current.clientWidth)
  }, [])

  // Otomatik yavaş kaydırma
  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => {
      setOffset(prev => {
        const max = maxOffset()
        if (max <= 0) return 0
        const next = prev - 0.5
        return next < -max ? 0 : next
      })
    }, 16)
  }, [maxOffset])

  const stopAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current)
  }, [])

  useEffect(() => {
    if (imgLoaded) startAuto()
    return stopAuto
  }, [imgLoaded, startAuto, stopAuto])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3500)
    return () => clearTimeout(t)
  }, [])

  // Mouse
  const onMouseDown = e => {
    stopAuto(); setDragging(true)
    setStartX(e.clientX); setStartOffset(offset)
  }
  const onMouseMove = e => {
    if (!dragging) return
    const max = maxOffset()
    setOffset(Math.min(0, Math.max(-max, startOffset + (e.clientX - startX))))
  }
  const onMouseUp = () => { setDragging(false); startAuto() }

  // Touch
  const onTouchStart = e => {
    stopAuto(); setDragging(true)
    setStartX(e.touches[0].clientX); setStartOffset(offset)
  }
  const onTouchMove = e => {
    if (!dragging) return
    const max = maxOffset()
    setOffset(Math.min(0, Math.max(-max, startOffset + (e.touches[0].clientX - startX))))
  }
  const onTouchEnd = () => { setDragging(false); startAuto() }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <img
        ref={imgRef}
        src={src}
        alt="360° Panorama"
        draggable={false}
        onLoad={() => setImgLoaded(true)}
        style={{
          height: '100%',
          width: 'auto',
          maxWidth: 'none',
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.05s linear',
          display: 'block',
        }}
      />
      {/* İpucu */}
      <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white text-sm px-4 py-2 rounded-full transition-opacity duration-700 pointer-events-none ${showHint ? 'opacity-100' : 'opacity-0'}`}>
        <span>←</span>
        <span>Panoramayı görmek için sürükleyin</span>
        <span>→</span>
      </div>
      {/* 360 rozeti */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary-700/90 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
        <FaGlobeAmericas size={11} className="text-gold-400" />
        <span className="text-gold-400">360°</span>
      </div>
    </div>
  )
}

// ─── Ana sayfa ─────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const { docs: images, loading } = usePublishedCollection('gallery', 100)
  const { settings } = useSettings()
  const [lightbox, setLightbox] = useState(null)
  const social = settings?.social || {}
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  function prev() { setLightbox(i => (i - 1 + images.length) % images.length) }
  function next() { setLightbox(i => (i + 1) % images.length) }

  const currentImg = lightbox !== null ? images[lightbox] : null
  const isPanoramic = currentImg?.type === 'panoramic'

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
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow hover:shadow-lg bg-slate-100"
              onClick={() => setLightbox(idx)}
            >
              <img
                src={img.url || img.imageUrl}
                alt={img.title || ''}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {/* 360° rozeti */}
              {img.type === 'panoramic' && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-primary-700/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <FaGlobeAmericas size={10} className="text-gold-400" />
                  <span className="text-gold-400">360°</span>
                </div>
              )}
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
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => !isPanoramic && setLightbox(null)}
        >
          {/* Kapat */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gold-400 z-20 bg-black/30 p-2 rounded-full"
            onClick={e => { e.stopPropagation(); setLightbox(null) }}
          >
            <FaTimes size={22} />
          </button>

          {/* Sol ok */}
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 text-white hover:text-gold-400 bg-black/30 hover:bg-black/60 p-3 rounded-full transition-colors"
            onClick={e => { e.stopPropagation(); prev() }}
          >
            <FaChevronLeft size={24} />
          </button>

          {/* Sağ ok */}
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-white hover:text-gold-400 bg-black/30 hover:bg-black/60 p-3 rounded-full transition-colors"
            onClick={e => { e.stopPropagation(); next() }}
          >
            <FaChevronRight size={24} />
          </button>

          {/* İçerik */}
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {isPanoramic ? (
              <div className="w-full" style={{ height: '85vh' }}>
                <PanoramaViewer src={currentImg.url || currentImg.imageUrl} />
              </div>
            ) : (
              <img
                src={currentImg?.url || currentImg?.imageUrl}
                alt={currentImg?.title}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>

          {/* Başlık */}
          {currentImg?.title && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-base font-semibold bg-black/50 px-4 py-2 rounded-full z-20 pointer-events-none">
              {currentImg.title}
            </div>
          )}
        </div>
      )}

      {/* Sosyal medya */}
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

import { useState, useRef, useEffect, useCallback } from 'react'
import SectionHeader from '../components/SectionHeader'
import { usePublishedCollection, useStaticCollection } from '../hooks/useFirestore'
import { useSettings } from '../hooks/useSettings'
import { supabase } from '../lib/supabase'
import {
  FaTimes, FaChevronLeft, FaChevronRight,
  FaFacebook, FaInstagram, FaYoutube, FaTwitter, FaWhatsapp, FaTiktok,
  FaGlobeAmericas, FaHeart
} from 'react-icons/fa'

function getLiked() {
  try { return new Set(JSON.parse(localStorage.getItem('gallery_liked') || '[]')) } catch { return new Set() }
}
function saveLiked(set) {
  localStorage.setItem('gallery_liked', JSON.stringify([...set]))
}
function getStoredCounts() {
  try { return JSON.parse(localStorage.getItem('gallery_counts') || '{}') } catch { return {} }
}
function saveStoredCounts(obj) {
  localStorage.setItem('gallery_counts', JSON.stringify(obj))
}

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
  const autoRef    = useRef(null)

  const [displayW, setDisplayW] = useState(0)   // resmin px cinsinden genişliği
  const [maxScroll, setMaxScroll] = useState(0)  // kaydırılabilecek max px
  const [offset,    setOffset]    = useState(0)
  const [dragging,  setDragging]  = useState(false)
  const [startX,    setStartX]    = useState(0)
  const [startOff,  setStartOff]  = useState(0)
  const [showHint,  setShowHint]  = useState(true)

  // Resim yüklenince gerçek boyutları ölç, explicit px genişlik hesapla
  function onImgLoad(e) {
    const img = e.currentTarget
    const ctn = containerRef.current
    if (!ctn) return
    const cH = ctn.clientHeight
    const cW = ctn.clientWidth
    const nW = img.naturalWidth
    const nH = img.naturalHeight
    if (!nH) return
    const dw = Math.round(nW * (cH / nH))   // yüksekliğe sığdırılmış genişlik
    setDisplayW(dw)
    setMaxScroll(Math.max(0, dw - cW))
  }

  // Otomatik yavaş kaydırma
  function startAuto(scroll) {
    clearInterval(autoRef.current)
    if (scroll <= 0) return
    autoRef.current = setInterval(() => {
      setOffset(prev => {
        const next = prev - 0.5
        return next < -scroll ? 0 : next
      })
    }, 16)
  }
  function stopAuto() { clearInterval(autoRef.current) }

  useEffect(() => {
    if (maxScroll > 0) startAuto(maxScroll)
    return stopAuto
  }, [maxScroll])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3500)
    return () => clearTimeout(t)
  }, [])

  // Mouse
  const onMouseDown = e => {
    stopAuto()
    setDragging(true); setStartX(e.clientX); setStartOff(offset)
  }
  const onMouseMove = e => {
    if (!dragging) return
    setOffset(o => Math.min(0, Math.max(-maxScroll, startOff + (e.clientX - startX))))
  }
  const onMouseUp = () => { setDragging(false); startAuto(maxScroll) }

  // Touch
  const onTouchStart = e => {
    stopAuto()
    setDragging(true); setStartX(e.touches[0].clientX); setStartOff(offset)
  }
  const onTouchMove = e => {
    if (!dragging) return
    setOffset(o => Math.min(0, Math.max(-maxScroll, startOff + (e.touches[0].clientX - startX))))
  }
  const onTouchEnd = () => { setDragging(false); startAuto(maxScroll) }

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{
        width: '100%', height: '100%',
        overflow: 'hidden', position: 'relative',
        backgroundColor: '#000',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* Görünmez resim — boyut ölçmek için */}
      {displayW === 0 && (
        <img src={src} onLoad={onImgLoad} style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} alt="" />
      )}

      {/* Görünür, kaydırılan resim */}
      {displayW > 0 && (
        <img
          src={src}
          alt="360° Panorama"
          draggable={false}
          style={{
            display: 'block',
            width:  `${displayW}px`,
            height: '100%',
            maxWidth: 'none',        /* Tailwind'in max-width:100% ezmesini engelle */
            transform: `translateX(${offset}px)`,
            transition: dragging ? 'none' : 'transform 0.03s linear',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* İpucu */}
      <div
        style={{ transition: 'opacity 0.7s', opacity: showHint ? 1 : 0 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none whitespace-nowrap"
      >
        <span>←</span><span>Panoramayı görmek için sürükleyin</span><span>→</span>
      </div>

      {/* 360° rozeti */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary-700/90 px-2.5 py-1 rounded-full pointer-events-none">
        <FaGlobeAmericas size={11} className="text-gold-400" />
        <span className="text-gold-400 text-xs font-bold">360°</span>
      </div>
    </div>
  )
}

// ─── Ana sayfa ─────────────────────────────────────────────────────────────
export default function GalleryPage() {
  // useStaticCollection: realtime yok, kota tasarrufu
  const { docs: images, loading } = useStaticCollection('gallery', 100, 'order', true)
  const { settings } = useSettings()
  const [lightbox, setLightbox] = useState(null)
  const [liked, setLiked] = useState(getLiked)
  // likeCounts: localStorage'dan başlat (sayfa yenilenince kaybolmaz)
  const [likeCounts, setLikeCounts] = useState(getStoredCounts)

  // images yüklenince: localStorage'da olmayan yeni öğeleri DB değeriyle başlat
  useEffect(() => {
    if (images.length === 0) return
    setLikeCounts(prev => {
      const next = { ...prev }
      let changed = false
      images.forEach(img => {
        if (!(img.id in next)) { next[img.id] = img.likes ?? 0; changed = true }
      })
      if (changed) saveStoredCounts(next)
      return changed ? next : prev
    })
  }, [images])

  const social = settings?.social || {}
  const activeSocials = Object.entries(SOCIAL_ICONS).filter(([key]) => social[key])

  async function toggleLike(e, img) {
    e.stopPropagation()
    const id = img.id
    const isLiked = liked.has(id)
    const current = likeCounts[id] ?? 0
    const newCount = isLiked ? Math.max(0, current - 1) : current + 1
    // State + localStorage güncelle (sayfa yenilenince de kalır)
    setLikeCounts(prev => {
      const next = { ...prev, [id]: newCount }
      saveStoredCounts(next)
      return next
    })
    const next = new Set(liked)
    isLiked ? next.delete(id) : next.add(id)
    setLiked(next)
    saveLiked(next)
    // DB güncelle (hata olsa bile UI doğru kalır)
    supabase.from('gallery').update({ likes: newCount }).eq('id', id)
  }

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
              {/* Beğeni butonu */}
              <button
                onClick={e => toggleLike(e, img)}
                className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold transition-all"
              >
                <FaHeart size={11} className={liked.has(img.id) ? 'text-red-400' : 'text-white/60'} />
                <span>{likeCounts[img.id] ?? img.likes ?? 0}</span>
              </button>
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

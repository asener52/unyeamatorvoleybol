import { useState, useEffect, useCallback } from 'react'
import { usePublishedCollection } from '../hooks/useFirestore'
import { FaChevronLeft, FaChevronRight, FaVolleyballBall } from 'react-icons/fa'

export default function HeroSlider() {
  const { docs: slides, loading } = usePublishedCollection('sliders', 10, 'order', true)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % Math.max(slides.length, 1))
  }, [slides.length])

  useEffect(() => {
    if (loading || slides.length < 2) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [loading, slides.length, next])

  if (loading) {
    return (
      <div className="w-full h-[420px] md:h-[560px] bg-primary-800 flex items-center justify-center">
        <FaVolleyballBall className="text-gold-400 text-5xl animate-spin" style={{ animationDuration: '2s' }} />
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="w-full h-[420px] md:h-[560px] bg-gradient-to-br from-primary-900 to-primary-700 flex flex-col items-center justify-center gap-4">
        <FaVolleyballBall className="text-gold-400 text-6xl" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Ünye Amatör Voleybol Topluluğu</h1>
        <p className="text-blue-200 text-lg">Admin panelinden slider görseli ekleyin</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden w-full h-[420px] md:h-[560px] select-none">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-12 bg-gold-500 rounded" />
                <span className="text-gold-400 text-sm font-semibold uppercase tracking-widest">Ünye Voleybol</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="text-lg md:text-xl text-blue-100 drop-shadow">{slide.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button onClick={() => setCurrent(i => (i - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors">
            <FaChevronLeft size={20} />
          </button>
          <button onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors">
            <FaChevronRight size={20} />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-gold-400 scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

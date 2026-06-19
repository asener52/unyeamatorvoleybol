import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMember } from '../contexts/MemberAuthContext'
import { FaVolleyballBall, FaCheckCircle, FaCalendarAlt, FaLock } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  try { return format(new Date(dateStr), 'd MMMM yyyy', { locale: tr }) } catch { return dateStr }
}

export default function MatchRequestPage() {
  const location = useLocation()
  const preSelected = location.state || {}
  const { member } = useMember()

  const [selectedMatch, setSelectedMatch] = useState(
    preSelected.eventId ? { id: preSelected.eventId, title: preSelected.eventTitle, date: preSelected.eventDate } : null
  )
  const [type, setType] = useState('oyuncu')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  useEffect(() => {
    async function fetchMatches() {
      const today = new Date().toISOString().slice(0, 10)

      const { data } = await supabase
        .from('events')
        .select('id, title, date, time, location')
        .eq('type', 'Maç')
        .eq('published', true)
        .gte('date', today)
        .order('date', { ascending: true })
      setMatches(data || [])
      setLoadingMatches(false)
    }
    fetchMatches()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedMatch) { setError('Lütfen bir maç seçin.'); return }
    setSaving(true)
    setError('')
    try {
      // Aynı üyenin aynı etkinliğe tekrar başvurup başvurmadığını kontrol et
      const { data: existing } = await supabase
        .from('match_requests')
        .select('id')
        .eq('member_id', member.id)
        .eq('event_id', selectedMatch.id)
        .limit(1)
      if (existing && existing.length > 0) {
        setError('Bu etkinliğe zaten başvurdunuz.')
        setSaving(false)
        return
      }

      const { error: err } = await supabase.from('match_requests').insert([{
        name: member.name,
        phone: member.phone,
        type,
        member_id: member.id,
        event_id: selectedMatch.id,
        event_title: selectedMatch.title,
        event_date: selectedMatch.date,
      }])
      if (err) throw err
      setDone(true)
    } catch (err) {
      setError('Bir hata oluştu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Üye girişi yoksa giriş ekranı göster
  if (!member) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-primary-50 rounded-full p-6 inline-flex mb-6">
            <FaLock className="text-primary-600 text-4xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Üye Girişi Gerekli</h2>
          <p className="text-slate-500 mb-6">
            Maça katılım formu doldurmak için üye girişi yapmanız gerekmektedir.
          </p>
          <Link
            to="/uye-giris"
            state={{ from: '/mac-kayit', ...location.state }}
            className="inline-block bg-primary-700 hover:bg-primary-800 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Üye Girişi Yap
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Henüz üye değil misiniz?{' '}
            <Link to="/uye-ol" className="text-primary-600 hover:text-primary-800 font-semibold">Üye Ol</Link>
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Talebiniz Alındı!</h2>
          {selectedMatch?.title && (
            <p className="text-primary-700 font-semibold mb-2">{selectedMatch.title}</p>
          )}
          <p className="text-slate-500 mb-6">
            {type === 'oyuncu'
              ? 'Oyuncu olarak katılım talebiniz iletildi. Yönetici sizinle iletişime geçecek.'
              : 'Seyirci olarak katılım talebiniz iletildi. Sizi aramızda görmekten mutluluk duyarız!'}
          </p>
          <button
            onClick={() => { setDone(false); setSelectedMatch(null); setType('oyuncu') }}
            className="text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors"
          >
            Yeni talep oluştur
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-4 animate-bounce" style={{ animationDuration: '2s' }} />
        <h1 className="text-3xl font-extrabold text-primary-900 mb-2">Maça Katıl!</h1>
        <p className="text-slate-500">Katılmak istediğinizi bildirin, yönetici sizinle iletişime geçsin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">

        {/* Üye bilgisi */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {member.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-primary-900 text-sm">{member.name}</div>
            <div className="text-xs text-primary-600">{member.phone}</div>
          </div>
        </div>

        {/* Maç Seçimi */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            <span className="flex items-center gap-1.5"><FaCalendarAlt size={13} /> Hangi Maça Katılmak İstiyorsunuz?</span>
          </label>
          {loadingMatches ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-200">
              Yaklaşan maç bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(match => {
                const selected = selectedMatch?.id === match.id
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <FaVolleyballBall size={16} className={`mt-0.5 shrink-0 ${selected ? 'text-primary-600' : 'text-slate-300'}`} />
                    <div>
                      <div className={`font-semibold text-sm ${selected ? 'text-primary-800' : 'text-slate-800'}`}>{match.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatEventDate(match.date)}{match.time ? ` · ${match.time}` : ''}{match.location ? ` · ${match.location}` : ''}
                      </div>
                    </div>
                    {selected && (
                      <span className="ml-auto text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full font-semibold shrink-0">Seçildi</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Katılım Türü */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Katılım Türü *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('oyuncu')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === 'oyuncu'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <FaVolleyballBall size={24} className={type === 'oyuncu' ? 'text-primary-600' : 'text-slate-400'} />
              <div>
                <div className="font-bold text-sm">Oyuncu</div>
                <div className="text-xs opacity-70">Maçta oynamak istiyorum</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('seyirci')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === 'seyirci'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <span className={`text-2xl ${type === 'seyirci' ? 'text-primary-600' : 'text-slate-400'}`}>👁️</span>
              <div>
                <div className="font-bold text-sm">Seyirci</div>
                <div className="text-xs opacity-70">İzlemek istiyorum</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !selectedMatch}
          className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Gönderiliyor...' : 'Katılım Talebimi Gönder'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Bilgileriniz yalnızca yönetici tarafından görülür.
        </p>
      </form>
    </div>
  )
}

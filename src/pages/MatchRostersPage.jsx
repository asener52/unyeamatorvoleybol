import { useStaticCollection } from '../hooks/useFirestore'
import { FaCalendarAlt, FaShieldAlt, FaVolleyballBall } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

function displayDate(date) {
  if (!date) return ''
  try { return format(parseISO(String(date).slice(0, 10)), 'd MMMM yyyy', { locale: tr }) } catch { return date }
}

function Player({ player, team }) {
  return (
    <div className={`min-w-0 rounded-lg border px-1.5 py-2 text-center shadow-sm ${
      team === 'a' ? 'bg-blue-700/90 border-blue-300' : 'bg-red-700/90 border-red-300'
    }`}>
      <div className="text-white font-bold text-xs sm:text-sm truncate" title={player.name}>{player.name}</div>
      <div className="text-white/70 text-[9px] sm:text-[10px] truncate">{player.position}</div>
    </div>
  )
}

function Court({ roster }) {
  const teamA = roster.team_a || []
  const teamB = roster.team_b || []
  return (
    <div className="relative bg-orange-300 border-[6px] border-blue-500 rounded-xl overflow-hidden shadow-inner">
      <div className="absolute inset-y-0 left-1/2 w-1 bg-white -translate-x-1/2 z-10 shadow" />
      <div className="absolute inset-y-0 left-1/2 w-3 bg-slate-800/60 -translate-x-1/2 z-0" />
      <div className="absolute inset-y-0 left-1/3 border-l-2 border-white/80 pointer-events-none" />
      <div className="absolute inset-y-0 left-2/3 border-l-2 border-white/80 pointer-events-none" />
      <div className="grid grid-cols-2 min-h-[330px] sm:min-h-[400px]">
        <div className="p-3 sm:p-5 pr-5 sm:pr-8 grid grid-cols-2 sm:grid-cols-3 content-center gap-3">
          {teamA.map(player => <Player key={player.request_id} player={player} team="a" />)}
        </div>
        <div className="p-3 sm:p-5 pl-5 sm:pl-8 grid grid-cols-2 sm:grid-cols-3 content-center gap-3">
          {teamB.map(player => <Player key={player.request_id} player={player} team="b" />)}
        </div>
      </div>
      <div className="absolute top-2 left-3 bg-blue-800 text-white text-xs font-extrabold px-3 py-1 rounded-full">A TAKIMI</div>
      <div className="absolute top-2 right-3 bg-red-800 text-white text-xs font-extrabold px-3 py-1 rounded-full">B TAKIMI</div>
    </div>
  )
}

export default function MatchRostersPage() {
  const { docs: rosters, loading } = useStaticCollection('match_rosters', 20, 'event_date', true)
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-9">
        <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-3" />
        <h1 className="text-3xl font-extrabold text-primary-900">Maç Kadrosu</h1>
        <p className="text-slate-500 mt-2">Yayınlanan takımlar ve yedek oyuncular</p>
      </div>
      {loading ? (
        <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
      ) : !rosters.length ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
          Henüz yayınlanmış maç kadrosu yok.
        </div>
      ) : (
        <div className="space-y-10">
          {rosters.map(roster => (
            <section key={roster.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-slate-800">{roster.event_title}</h2>
                {roster.event_date && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <FaCalendarAlt size={12} /> {displayDate(roster.event_date)}
                  </div>
                )}
              </div>
              <Court roster={roster} />
              {(roster.reserves || []).length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <FaShieldAlt /> Yedek Kadro
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {roster.reserves.map(player => (
                      <span key={player.request_id} className="bg-white border border-amber-200 text-amber-900 px-3 py-1.5 rounded-full text-sm font-semibold">
                        {player.name} <small className="text-amber-600">· {player.position}</small>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

import { useStaticCollection } from '../hooks/useFirestore'
import { FaCalendarAlt, FaShieldAlt, FaVolleyballBall } from 'react-icons/fa'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

function displayDate(date) {
  if (!date) return ''
  try { return format(parseISO(String(date).slice(0, 10)), 'd MMMM yyyy', { locale: tr }) } catch { return date }
}

const TEAM_SLOTS = {
  a: [
    { key: 'back_top', left: 9, top: 20 },
    { key: 'back_middle', left: 9, top: 50 },
    { key: 'back_bottom', left: 9, top: 80 },
    { key: 'front_top', left: 39, top: 20 },
    { key: 'front_middle', left: 39, top: 50 },
    { key: 'front_bottom', left: 39, top: 80 },
  ],
  b: [
    { key: 'front_top', left: 61, top: 20 },
    { key: 'front_middle', left: 61, top: 50 },
    { key: 'front_bottom', left: 61, top: 80 },
    { key: 'back_top', left: 91, top: 20 },
    { key: 'back_middle', left: 91, top: 50 },
    { key: 'back_bottom', left: 91, top: 80 },
  ],
}

function preferredSlots(position = '') {
  if (position.startsWith('Pasör Çaprazı')) return ['front_bottom', 'back_bottom', 'front_top']
  if (position.startsWith('Pasör')) return ['back_bottom', 'front_bottom', 'back_middle']
  if (position.startsWith('Smaçör')) return ['front_top', 'back_top', 'front_bottom']
  if (position.startsWith('Orta')) return ['front_middle', 'front_top', 'front_bottom']
  if (position.startsWith('Libero')) return ['back_middle', 'back_top', 'back_bottom']
  if (position.startsWith('Defans')) return ['back_middle', 'back_top', 'back_bottom']
  return ['back_top', 'back_middle', 'front_top', 'front_middle', 'back_bottom', 'front_bottom']
}

function positionPlayers(players, team) {
  const available = [...TEAM_SLOTS[team]]
  return players.map((player, index) => {
    const preferences = preferredSlots(player.position)
    let preferredIndex = -1
    for (const preference of preferences) {
      preferredIndex = available.findIndex(slot => slot.key === preference)
      if (preferredIndex >= 0) break
    }
    const slotIndex = preferredIndex >= 0 ? preferredIndex : 0
    const slot = available.splice(slotIndex, 1)[0]
    return { player, number: index + 1, slot }
  }).filter(item => item.slot)
}

function CourtPlayer({ player, team, number, slot }) {
  return (
    <div className="absolute min-w-0 w-20 sm:w-28 flex flex-col items-center justify-center z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.left}%`, top: `${slot.top}%` }}>
      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-sm sm:text-base ${
        team === 'a' ? 'bg-blue-700' : 'bg-red-700'
      }`}>
        {number}
      </div>
      <div className="mt-1 bg-slate-950/80 text-white rounded-md px-1.5 py-1 max-w-full text-center shadow">
        <div className="font-bold text-[9px] sm:text-xs truncate" title={player.name}>{player.name}</div>
        <div className="text-white/65 text-[7px] sm:text-[9px] truncate">{player.position}</div>
      </div>
    </div>
  )
}

function Court({ roster }) {
  const teamA = roster.team_a || []
  const teamB = roster.team_b || []
  const reserves = roster.reserves || []
  const positionedA = positionPlayers(teamA, 'a')
  const positionedB = positionPlayers(teamB, 'b')
  return (
    <div className="bg-sky-700 rounded-2xl p-3 sm:p-6 shadow-inner overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="relative flex-1 bg-orange-400 border-[3px] border-white shadow-xl aspect-[18/10] min-h-[300px]">
          {/* Orta çizgi ve file */}
          <div className="absolute inset-y-0 left-1/2 border-l-2 border-white -translate-x-1/2 z-10" />
          <div className="absolute -top-2 -bottom-2 left-1/2 w-2 bg-slate-900/80 -translate-x-1/2 z-10 shadow-lg">
            <div className="w-full h-full opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 7px, white 8px)' }} />
          </div>
          <div className="absolute -top-3 left-1/2 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 z-20" />
          <div className="absolute -bottom-3 left-1/2 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 z-20" />

          {/* Üç metre hücum çizgileri */}
          <div className="absolute inset-y-0 left-1/3 border-l-2 border-white/90 pointer-events-none" />
          <div className="absolute inset-y-0 left-2/3 border-l-2 border-white/90 pointer-events-none" />

          {positionedA.map(({ player, number, slot }) => (
            <CourtPlayer key={player.request_id} player={player} team="a" number={number} slot={slot} />
          ))}
          {positionedB.map(({ player, number, slot }) => (
            <CourtPlayer key={player.request_id} player={player} team="b" number={number} slot={slot} />
          ))}

          <div className="absolute top-2 left-2 bg-blue-800 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full z-30">A TAKIMI</div>
          <div className="absolute top-2 right-2 bg-red-800 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full z-30">B TAKIMI</div>
        </div>

        {/* Saha kenarı yedek kulübesi */}
        <aside className="lg:w-48 bg-sky-900/85 border-2 border-white/70 rounded-xl p-3 text-white shrink-0">
          <h3 className="font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 border-b border-white/20 pb-2 mb-2">
            <FaShieldAlt className="text-amber-300" /> Yedek Alanı
          </h3>
          {reserves.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {reserves.map((player, index) => (
                <div key={player.request_id} className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg p-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">
                    Y{index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate">{player.name}</div>
                    <div className="text-[9px] text-white/60 truncate">{player.position}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/50 text-center py-5">Yedek oyuncu yok</div>
          )}
          <div className="mt-3 flex gap-1 justify-center">
            {[1, 2, 3, 4].map(seat => <span key={seat} className="w-7 h-2 rounded-sm bg-slate-300/50" />)}
          </div>
        </aside>
      </div>

      {/* Hakem masası ve servis bölgeleri */}
      <div className="flex items-center justify-center gap-2 mt-3 text-white/70">
        <span className="h-1 w-16 bg-white/50 rounded-full" />
        <span className="text-[9px] font-semibold uppercase tracking-widest">Hakem Masası</span>
        <span className="h-1 w-16 bg-white/50 rounded-full" />
      </div>
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
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

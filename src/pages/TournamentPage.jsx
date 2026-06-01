import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SectionHeader from '../components/SectionHeader'
import { FaVolleyballBall, FaCalendarAlt, FaUsers, FaTable, FaTrophy, FaFutbol, FaMapMarkerAlt } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDt(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}
function formatDate(d) {
  if (!d) return ''
  try { return format(new Date(d), 'd MMM yyyy', { locale: tr }) } catch { return '' }
}

const STATUS_CLS = { upcoming: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700', completed: 'bg-slate-100 text-slate-600' }
const STATUS_LBL = { upcoming: 'Yaklaşan', active: 'Devam Ediyor', completed: 'Tamamlandı' }

function calcStandings(teams, fixtures) {
  const map = {}
  teams.forEach(t => { map[t.id] = { ...t, played: 0, won: 0, lost: 0, sets_for: 0, sets_against: 0, points: 0 } })
  fixtures.filter(f => f.status === 'completed').forEach(f => {
    const hs = f.home_score ?? 0, as = f.away_score ?? 0
    if (map[f.home_team_id]) { map[f.home_team_id].played++; map[f.home_team_id].sets_for += hs; map[f.home_team_id].sets_against += as; if (hs > as) { map[f.home_team_id].won++; map[f.home_team_id].points += 3 } else map[f.home_team_id].lost++ }
    if (map[f.away_team_id]) { map[f.away_team_id].played++; map[f.away_team_id].sets_for += as; map[f.away_team_id].sets_against += hs; if (as > hs) { map[f.away_team_id].won++; map[f.away_team_id].points += 3 } else map[f.away_team_id].lost++ }
  })
  return Object.values(map).sort((a, b) => b.points - a.points || b.won - a.won)
}

// ─── Turnuva Detay ─────────────────────────────────────────────────────────
function TournamentDetail({ id }) {
  const [tournament, setTournament] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('teams')
  const [expandedTeam, setExpandedTeam] = useState(null)

  useEffect(() => {
    async function load() {
      const [t, tm, pl, fx] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('teams').select('*').eq('tournament_id', id),
        supabase.from('players').select('*, teams!inner(tournament_id)').eq('teams.tournament_id', id),
        supabase.from('fixtures').select('*').eq('tournament_id', id).order('match_date'),
      ])
      setTournament(t.data)
      setTeams(tm.data || [])
      setPlayers(pl.data || [])
      setFixtures(fx.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)}</div>
  if (!tournament) return <div className="text-center py-20 text-slate-400">Turnuva bulunamadı.</div>

  const standings = calcStandings(teams, fixtures)
  const upcoming = fixtures.filter(f => f.status === 'scheduled')
  const completed = fixtures.filter(f => f.status === 'completed')

  return (
    <div>
      {/* Başlık */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-6 md:p-8 text-white mb-8">
        <Link to="/turnuvalar" className="text-blue-300 hover:text-white text-sm mb-4 inline-block">← Turnuvalara Dön</Link>
        <div className="flex items-start gap-4">
          <FaTrophy className="text-gold-400 text-4xl shrink-0 mt-1" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{tournament.name}</h1>
            {tournament.description && <p className="text-blue-200 mt-1">{tournament.description}</p>}
            <div className="flex flex-wrap gap-3 mt-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CLS[tournament.status]}`}>{STATUS_LBL[tournament.status]}</span>
              {tournament.start_date && <span className="flex items-center gap-1 text-blue-200 text-sm"><FaCalendarAlt size={12} /> {formatDate(tournament.start_date)} — {formatDate(tournament.end_date)}</span>}
              <span className="flex items-center gap-1 text-blue-200 text-sm"><FaUsers size={12} /> {teams.length} Takım</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab menü */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
        {[['teams', FaUsers, 'Takımlar'], ['fixtures', FaFutbol, 'Fikstür'], ['standings', FaTable, 'Puan Durumu']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-primary-700 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* TAKIMLAR */}
      {tab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.length === 0 && <p className="text-slate-400 text-center py-16 col-span-2">Henüz takım yok.</p>}
          {teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id)
            const isExp = expandedTeam === team.id
            return (
              <div key={team.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => setExpandedTeam(isExp ? null : team.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
                  {team.logo_url ? <img src={team.logo_url} alt={team.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary-100" /> : <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center"><FaVolleyballBall className="text-primary-500 text-xl" /></div>}
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{team.name}</div>
                    <div className="text-sm text-slate-400">{teamPlayers.length} oyuncu</div>
                  </div>
                  <span className="text-slate-400 text-sm">{isExp ? '▲' : '▼'}</span>
                </button>
                {isExp && teamPlayers.length > 0 && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">#</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Oyuncu</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Pozisyon</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {teamPlayers.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-400 font-mono text-xs w-8">{p.number ?? '-'}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {p.photo_url ? <img src={p.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : null}
                                <span className="font-medium text-slate-800">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 text-xs">{p.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FİKSTÜR */}
      {tab === 'fixtures' && (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Yaklaşan Maçlar</h3>
              <div className="space-y-2">
                {upcoming.map(f => <FixtureRow key={f.id} f={f} teams={teams} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-400 mb-3 text-sm uppercase tracking-wide">Oynanan Maçlar</h3>
              <div className="space-y-2 opacity-80">
                {[...completed].reverse().map(f => <FixtureRow key={f.id} f={f} teams={teams} />)}
              </div>
            </div>
          )}
          {fixtures.length === 0 && <p className="text-slate-400 text-center py-16">Henüz maç eklenmemiş.</p>}
        </div>
      )}

      {/* PUAN DURUMU */}
      {tab === 'standings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {standings.length === 0 ? (
            <p className="text-slate-400 text-center py-16">Henüz puan durumu yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Takım</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">O</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">G</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">M</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600 hidden sm:table-cell">Set A/Y</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">P</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standings.map((s, i) => (
                  <tr key={s.id} className={`${i === 0 ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.logo_url ? <img src={s.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : <FaVolleyballBall className="text-primary-300" size={14} />}
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        {i === 0 && <FaTrophy className="text-gold-500" size={12} />}
                      </div>
                    </td>
                    <td className="text-center px-3 py-3 text-slate-600">{s.played}</td>
                    <td className="text-center px-3 py-3 text-green-600 font-bold">{s.won}</td>
                    <td className="text-center px-3 py-3 text-red-500">{s.lost}</td>
                    <td className="text-center px-3 py-3 text-slate-500 hidden sm:table-cell">{s.sets_for}/{s.sets_against}</td>
                    <td className="text-center px-3 py-3 font-extrabold text-primary-700 text-base">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function FixtureRow({ f, teams }) {
  const home = teams.find(t => t.id === f.home_team_id)
  const away = teams.find(t => t.id === f.away_team_id)
  const done = f.status === 'completed'
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
      <div className="flex-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end">
          {home?.logo_url && <img src={home.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />}
          <span className="font-semibold text-slate-800 text-sm text-right">{home?.name ?? '?'}</span>
        </div>
        <div className={`text-center px-3 py-1 rounded-lg font-bold text-sm shrink-0 ${done ? 'bg-slate-800 text-white min-w-[60px]' : 'bg-primary-50 text-primary-700 text-xs'}`}>
          {done ? `${f.home_score ?? '-'} - ${f.away_score ?? '-'}` : 'vs'}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-slate-800 text-sm">{away?.name ?? '?'}</span>
          {away?.logo_url && <img src={away.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />}
        </div>
      </div>
      <div className="text-right text-xs text-slate-400 shrink-0 space-y-0.5">
        {f.round && <div className="font-medium text-slate-600">{f.round}</div>}
        {f.match_date && <div className="flex items-center gap-1"><FaCalendarAlt size={10} />{formatDt(f.match_date)}</div>}
        {f.venue && <div className="flex items-center gap-1"><FaMapMarkerAlt size={10} />{f.venue}</div>}
      </div>
    </div>
  )
}

// ─── Turnuva Listesi ───────────────────────────────────────────────────────
function TournamentList() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tournaments').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { setTournaments(data || []); setLoading(false) })
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SectionHeader title="Turnuvalar" subtitle="Müsabakalar" />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : tournaments.length === 0 ? (
        <p className="text-center text-slate-400 py-20">Henüz turnuva yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tournaments.map(t => (
            <Link key={t.id} to={`/turnuvalar/${t.id}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md hover:border-primary-200 transition-all group">
              <div className="flex items-start gap-4">
                <FaTrophy className={`text-3xl mt-1 shrink-0 ${t.status === 'active' ? 'text-gold-500' : 'text-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-lg group-hover:text-primary-700 transition-colors">{t.name}</div>
                  {t.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{t.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CLS[t.status]}`}>{STATUS_LBL[t.status]}</span>
                    {t.start_date && <span className="text-xs text-slate-400 flex items-center gap-1"><FaCalendarAlt size={10} />{formatDate(t.start_date)}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TournamentPage() {
  const { id } = useParams()
  if (id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TournamentDetail id={id} />
      </div>
    )
  }
  return <TournamentList />
}

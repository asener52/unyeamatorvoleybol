import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { FaRandom, FaSave, FaEye, FaEyeSlash, FaVolleyballBall, FaSyncAlt } from 'react-icons/fa'

const POSITION_ORDER = ['Pasör', 'Pasör Çaprazı', 'Smaçör', 'Orta Oyuncu', 'Libero', 'Defans Uzmanı', 'Diğer']

function positionGroup(position = '') {
  if (position.startsWith('Pasör Çaprazı')) return 'Pasör Çaprazı'
  if (position.startsWith('Pasör')) return 'Pasör'
  if (position.startsWith('Smaçör')) return 'Smaçör'
  if (position.startsWith('Orta')) return 'Orta Oyuncu'
  if (position.startsWith('Libero')) return 'Libero'
  if (position.startsWith('Defans')) return 'Defans Uzmanı'
  return 'Diğer'
}

function phoneKey(phone = '') {
  return String(phone).replace(/\D/g, '').slice(-10)
}

function findMember(request, memberMap, memberList) {
  const byId = memberMap[String(request?.member_id)]
  if (byId) return byId

  const requestPhone = phoneKey(request?.phone)
  if (requestPhone) {
    const byPhone = memberList.find(member => phoneKey(member.phone) === requestPhone)
    if (byPhone) return byPhone
  }

  const requestName = String(request?.name || '').trim().toLocaleLowerCase('tr-TR')
  return memberList.find(member =>
    String(member.name || '').trim().toLocaleLowerCase('tr-TR') === requestName
  )
}

function distributePlayers(players) {
  const groups = Object.fromEntries(POSITION_ORDER.map(position => [position, []]))
  players.forEach(player => groups[positionGroup(player.position)].push(player))
  const teamA = []
  const teamB = []
  POSITION_ORDER.forEach(position => {
    groups[position].forEach(player => {
      if (teamA.length < teamB.length) teamA.push(player)
      else if (teamB.length < teamA.length) teamB.push(player)
      else (teamA.filter(p => positionGroup(p.position) === position).length <=
        teamB.filter(p => positionGroup(p.position) === position).length ? teamA : teamB).push(player)
    })
  })
  return { teamA, teamB }
}

function getEvents(requests) {
  const map = new Map()
  const today = new Date().toLocaleDateString('sv-SE')
  requests.forEach(request => {
    if (!request.event_id) return
    if (request.event_date && String(request.event_date).slice(0, 10) < today) return
    const key = String(request.event_id)
    if (!map.has(key)) map.set(key, {
      id: key, title: request.event_title || 'Maç', date: request.event_date || '',
    })
  })
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function TeamEditor({ title, players, color, currentTeam, onMove }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className={`px-4 py-3 font-bold ${color}`}>{title} <span className="float-right">{players.length}</span></div>
      <div className="divide-y divide-slate-100">
        {players.map(player => (
          <div key={player.request_id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800 truncate">{player.name}</div>
              <div className="text-xs text-slate-400">{player.position}</div>
            </div>
            <select value={currentTeam} onChange={e => onMove(player, e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs">
              <option value="a">A Takımı</option>
              <option value="b">B Takımı</option>
              <option value="reserve">Yedek</option>
            </select>
          </div>
        ))}
        {!players.length && <div className="p-5 text-center text-sm text-slate-400">Oyuncu yok</div>}
      </div>
    </div>
  )
}

export default function ManageMatchRosters() {
  const [params] = useSearchParams()
  const requestedEventId = params.get('event') || ''
  const [requests, setRequests] = useState([])
  const [members, setMembers] = useState({})
  const [rosters, setRosters] = useState([])
  const [eventId, setEventId] = useState(requestedEventId)
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [reserves, setReserves] = useState([])
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  function refreshPlayers(players, memberMap = members, requestList = requests) {
    const memberList = Object.values(memberMap)
    return (players || []).map(player => {
      const request = requestList.find(item => String(item.id) === String(player.request_id))
      const member = findMember({ ...request, ...player }, memberMap, memberList)
        || findMember(request, memberMap, memberList)
      return {
        ...player,
        member_id: member?.id || player.member_id,
        name: member?.name || player.name,
        position: member?.position || player.position,
      }
    })
  }

  function applySavedRoster(selectedEventId, rosterData) {
    const saved = rosterData.find(roster => roster.event_id === selectedEventId)
    setTeamA(refreshPlayers(saved?.team_a))
    setTeamB(refreshPlayers(saved?.team_b))
    setReserves(refreshPlayers(saved?.reserves))
    setPublished(saved?.published || false)
  }

  async function load() {
    return Promise.all([
      supabase.from('match_requests').select('*').order('event_date'),
      supabase.from('members').select('id,name,phone,position'),
      supabase.from('match_rosters').select('*').order('event_date'),
    ])
  }

  useEffect(() => {
    load().then(([{ data: requestData }, { data: memberData }, { data: rosterData }]) => {
      const nextRequests = requestData || []
      const nextRosters = rosterData || []
      const nextMembers = Object.fromEntries((memberData || []).map(member => [member.id, member]))
      const selectedEventId = requestedEventId || getEvents(nextRequests)[0]?.id || ''
      setRequests(nextRequests)
      setMembers(nextMembers)
      setRosters(nextRosters)
      setEventId(selectedEventId)
      const saved = nextRosters.find(roster => roster.event_id === selectedEventId)
      const currentPositions = players => {
        const memberList = Object.values(nextMembers)
        return (players || []).map(player => {
          const request = nextRequests.find(item => String(item.id) === String(player.request_id))
          const member = findMember({ ...request, ...player }, nextMembers, memberList)
            || findMember(request, nextMembers, memberList)
          return {
            ...player,
            member_id: member?.id || player.member_id,
            name: member?.name || player.name,
            position: member?.position || player.position,
          }
        })
      }
      setTeamA(currentPositions(saved?.team_a))
      setTeamB(currentPositions(saved?.team_b))
      setReserves(currentPositions(saved?.reserves))
      setPublished(saved?.published || false)
    })
  }, [requestedEventId])

  const events = useMemo(() => getEvents(requests), [requests])

  function buildAutomatic() {
    const eventRequests = requests.filter(request => String(request.event_id) === eventId)
    const memberList = Object.values(members)
    const asPlayers = eventRequests.filter(request => request.status === 'as_kadro' && request.type === 'oyuncu')
      .map(request => {
        const member = findMember(request, members, memberList)
        return {
          request_id: request.id,
          member_id: member?.id || request.member_id,
          name: member?.name || request.name,
          position: member?.position || request.position || 'Diğer',
        }
      })
    const reservePlayers = eventRequests.filter(request => request.status === 'yedek_kadro' && request.type === 'oyuncu')
      .map(request => {
        const member = findMember(request, members, memberList)
        return {
          request_id: request.id,
          member_id: member?.id || request.member_id,
          name: member?.name || request.name,
          position: member?.position || request.position || 'Diğer',
        }
      })
    const balanced = distributePlayers(asPlayers)
    setTeamA(balanced.teamA)
    setTeamB(balanced.teamB)
    setReserves(reservePlayers)
  }

  async function refreshRoster() {
    if (!eventId) return
    setRefreshing(true)

    const [{ data: requestData, error: requestError }, { data: memberData, error: memberError }] = await Promise.all([
      supabase.from('match_requests').select('*').order('event_date'),
      supabase.from('members').select('id,name,phone,position'),
    ])

    if (requestError || memberError) {
      alert('Kadro yenilenemedi: ' + (requestError?.message || memberError?.message))
      setRefreshing(false)
      return
    }

    const nextRequests = requestData || []
    const nextMembers = Object.fromEntries((memberData || []).map(member => [member.id, member]))
    const memberList = Object.values(nextMembers)
    const eventRequests = nextRequests.filter(request => String(request.event_id) === eventId)
    const asRequests = eventRequests.filter(request => request.status === 'as_kadro' && request.type === 'oyuncu')
    const reserveRequests = eventRequests.filter(request => request.status === 'yedek_kadro' && request.type === 'oyuncu')

    const toPlayer = request => {
      const member = findMember(request, nextMembers, memberList)
      return {
        request_id: request.id,
        member_id: member?.id || request.member_id,
        name: member?.name || request.name,
        position: member?.position || request.position || 'Diğer',
      }
    }

    const asById = new Map(asRequests.map(request => [String(request.id), toPlayer(request)]))
    const reserveById = new Map(reserveRequests.map(request => [String(request.id), toPlayer(request)]))
    const retainedIds = new Set()

    const keepTeamPlayers = list => list.flatMap(player => {
      const updated = asById.get(String(player.request_id))
      if (!updated) return []
      retainedIds.add(String(player.request_id))
      return [updated]
    })

    const nextTeamA = keepTeamPlayers(teamA)
    const nextTeamB = keepTeamPlayers(teamB)
    const nextReserves = []

    reserves.forEach(player => {
      const id = String(player.request_id)
      const updatedReserve = reserveById.get(id)
      if (updatedReserve) {
        nextReserves.push(updatedReserve)
        retainedIds.add(id)
      }
    })

    // Yedekten as kadroya alınanlar ve yeni as oyuncular, mevcut dizilişi
    // bozmadan oyuncu sayısı az olan takıma eklenir.
    asRequests.forEach(request => {
      const id = String(request.id)
      if (retainedIds.has(id)) return
      const player = asById.get(id)
      if (nextTeamA.length <= nextTeamB.length) nextTeamA.push(player)
      else nextTeamB.push(player)
      retainedIds.add(id)
    })

    // As kadrodan yedeğe alınanlar ve yeni yedekler yedek alanına taşınır.
    reserveRequests.forEach(request => {
      const id = String(request.id)
      if (retainedIds.has(id)) return
      nextReserves.push(reserveById.get(id))
      retainedIds.add(id)
    })

    setRequests(nextRequests)
    setMembers(nextMembers)
    setTeamA(nextTeamA)
    setTeamB(nextTeamB)
    setReserves(nextReserves)

    const event = getEvents(nextRequests).find(item => item.id === eventId)
    if (event) {
      const payload = {
        event_id: event.id,
        event_title: event.title,
        event_date: event.date || null,
        team_a: nextTeamA,
        team_b: nextTeamB,
        reserves: nextReserves,
        published,
        updated_at: new Date().toISOString(),
      }
      const { error: saveError } = await supabase
        .from('match_rosters')
        .upsert(payload, { onConflict: 'event_id' })
      if (saveError) {
        alert('Kadro yenilendi ancak kaydedilemedi: ' + saveError.message)
      } else {
        setRosters(current => [
          ...current.filter(roster => roster.event_id !== event.id),
          payload,
        ])
      }
    }
    setRefreshing(false)
  }

  function movePlayer(player, destination) {
    setTeamA(list => list.filter(item => item.request_id !== player.request_id))
    setTeamB(list => list.filter(item => item.request_id !== player.request_id))
    setReserves(list => list.filter(item => item.request_id !== player.request_id))
    if (destination === 'a') setTeamA(list => [...list, player])
    if (destination === 'b') setTeamB(list => [...list, player])
    if (destination === 'reserve') setReserves(list => [...list, player])
  }

  async function save(nextPublished = published) {
    const event = events.find(item => item.id === eventId)
    if (!event) return
    setSaving(true)
    const payload = {
      event_id: event.id,
      event_title: event.title,
      event_date: event.date || null,
      team_a: teamA,
      team_b: teamB,
      reserves,
      published: nextPublished,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('match_rosters').upsert(payload, { onConflict: 'event_id' })
    setSaving(false)
    if (error) alert('Kadro kaydedilemedi: ' + error.message)
    else {
      setPublished(nextPublished)
      setRosters(current => {
        const remaining = current.filter(roster => roster.event_id !== event.id)
        return [...remaining, { ...payload }]
      })
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><FaVolleyballBall /> Maç Kadrosu</h1>
          <p className="text-sm text-slate-500">As kadrodan mevkilere göre dengeli iki takım oluşturun.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refreshRoster} disabled={refreshing || !eventId}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Yenileniyor...' : 'Kadroyu Yenile'}
          </button>
          <button onClick={buildAutomatic} disabled={!eventId}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <FaRandom /> Otomatik Takım Oluştur
          </button>
          <button onClick={() => save(published)} disabled={saving || !eventId}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <FaSave /> Değişiklikleri Kaydet
          </button>
          <button onClick={() => save(!published)} disabled={saving || !eventId}
            className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold ${published ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {published ? <FaEyeSlash /> : <FaEye />} {published ? 'Yayından Kaldır' : 'Maç Kadrosunu Yayınla'}
          </button>
        </div>
      </div>
      <select value={eventId} onChange={e => { setEventId(e.target.value); applySavedRoster(e.target.value, rosters) }}
        className="w-full mb-5 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm">
        <option value="">Maç seçin</option>
        {events.map(event => <option key={event.id} value={event.id}>{event.date} — {event.title}</option>)}
      </select>
      <div className="grid lg:grid-cols-3 gap-4">
        <TeamEditor title="A Takımı" players={teamA} currentTeam="a" onMove={movePlayer} color="bg-blue-50 text-blue-800" />
        <TeamEditor title="B Takımı" players={teamB} currentTeam="b" onMove={movePlayer} color="bg-red-50 text-red-800" />
        <TeamEditor title="Yedek Kadro" players={reserves} currentTeam="reserve" onMove={movePlayer} color="bg-amber-50 text-amber-800" />
      </div>
    </div>
  )
}

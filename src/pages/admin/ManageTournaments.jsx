import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadFile } from '../../lib/supabase'
import { useCollection } from '../../hooks/useFirestore'
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaChevronDown, FaChevronUp,
  FaUsers, FaFutbol, FaTable, FaImage, FaVolleyballBall
} from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const POSITIONS = ['Pasör', 'Libero', 'Fil', 'Dış Vurucu', 'Orta Oyuncu']
const STATUS_OPT = ['upcoming', 'active', 'completed']
const STATUS_LABEL = { upcoming: 'Yaklaşan', active: 'Devam Ediyor', completed: 'Tamamlandı' }

// normalize() tarafından eklenen imageUrl/createdAt/id gibi alanları temizle
function pick(obj, keys) {
  return keys.reduce((acc, k) => { if (obj[k] !== undefined && obj[k] !== null) acc[k] = obj[k]; return acc }, {})
}

function formatDt(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}

// ─── Küçük modal ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const inp = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

// ─── Turnuva formu ─────────────────────────────────────────────────────────
function TournamentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    start_date: initial?.start_date || '',
    end_date: initial?.end_date || '',
    status: initial?.status || 'upcoming',
    published: initial?.published ?? false,
  })
  const [saving, setSaving] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try { await onSave(form); onClose() } catch (err) { alert(err.message) } finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Turnuva Adı" className={inp} />
      <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Açıklama" className={`${inp} resize-none`} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">Başlangıç</label>
          <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inp} /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">Bitiş</label>
          <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inp} /></div>
      </div>
      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
        {STATUS_OPT.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </select>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="w-4 h-4" />
        <span className="text-sm text-slate-700">Yayınla</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
      </div>
    </form>
  )
}

// ─── Takım formu ───────────────────────────────────────────────────────────
function TeamForm({ tournamentId, initial, onSave, onClose }) {
  const [form, setForm] = useState({ name: initial?.name || '', logo_url: initial?.logo_url || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleLogo(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadFile('gallery', file.name, file); setForm(f => ({ ...f, logo_url: url })) }
    catch (err) { alert(err.message) } finally { setUploading(false) }
  }
  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try { await onSave({ ...form, tournament_id: tournamentId }); onClose() } catch (err) { alert(err.message) } finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Takım Adı" className={inp} />
      <div className="flex items-center gap-3">
        {form.logo_url ? <img src={form.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover border" /> : <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center text-slate-300"><FaVolleyballBall /></div>}
        <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg cursor-pointer text-sm">
          <FaImage size={13} /> {uploading ? 'Yükleniyor...' : 'Logo Yükle'}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploading} />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
      </div>
    </form>
  )
}

// ─── Oyuncu formu ──────────────────────────────────────────────────────────
function PlayerForm({ teamId, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    number: initial?.number?.toString() || '',
    position: initial?.position || 'Dış Vurucu',
    photo_url: initial?.photo_url || '',
  })
  const [saving, setSaving] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try { await onSave({ ...form, team_id: teamId, number: form.number ? parseInt(form.number) : null }); onClose() } catch (err) { alert(err.message) } finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Oyuncu Adı" className={inp} />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Forma No" className={inp} />
        <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp}>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <input value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="Fotoğraf URL (isteğe bağlı)" className={inp} />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
      </div>
    </form>
  )
}

// ─── Fikstür formu ─────────────────────────────────────────────────────────
function FixtureForm({ tournamentId, teams, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    home_team_id: initial?.home_team_id || '',
    away_team_id: initial?.away_team_id || '',
    match_date: initial?.match_date ? initial.match_date.slice(0, 16) : '',
    round: initial?.round || '',
    venue: initial?.venue || '',
    home_score: initial?.home_score?.toString() ?? '',
    away_score: initial?.away_score?.toString() ?? '',
    status: initial?.status || 'scheduled',
  })
  const [saving, setSaving] = useState(false)
  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      await onSave({
        ...form,
        tournament_id: tournamentId,
        home_score: form.home_score !== '' ? parseInt(form.home_score) : null,
        away_score: form.away_score !== '' ? parseInt(form.away_score) : null,
      }); onClose()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Ev Sahibi</label>
          <select required value={form.home_team_id} onChange={e => setForm(f => ({ ...f, home_team_id: e.target.value }))} className={inp}>
            <option value="">Takım seç</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Misafir</label>
          <select required value={form.away_team_id} onChange={e => setForm(f => ({ ...f, away_team_id: e.target.value }))} className={inp}>
            <option value="">Takım seç</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">Set Skoru (Ev)</label>
          <input type="number" min="0" max="3" value={form.home_score} onChange={e => setForm(f => ({ ...f, home_score: e.target.value }))} placeholder="0-3" className={inp} /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">Set Skoru (Misafir)</label>
          <input type="number" min="0" max="3" value={form.away_score} onChange={e => setForm(f => ({ ...f, away_score: e.target.value }))} placeholder="0-3" className={inp} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))} placeholder="Tur (örn: Hafta 1)" className={inp} />
        <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Konum/Salon" className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} className={inp} />
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
          <option value="scheduled">Planlandı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
      </div>
    </form>
  )
}

// ─── Ana bileşen ───────────────────────────────────────────────────────────
export default function ManageTournaments() {
  const { docs: tournaments, loading } = useCollection('tournaments', 'created_at', 50)
  const { docs: allTeams } = useCollection('teams', 'created_at', 200)
  const { docs: allPlayers } = useCollection('players', 'created_at', 500)
  const { docs: allFixtures } = useCollection('fixtures', 'created_at', 500)

  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('teams')
  const [modal, setModal] = useState(null) // { type, data }

  function toggleExpand(id) {
    setExpanded(e => e === id ? null : id)
    setActiveTab('teams')
  }

  // CRUD helpers
  async function saveTournament(data) {
    const clean = pick(data, ['name', 'description', 'start_date', 'end_date', 'status', 'published'])
    if (modal?.data?.id) await supabase.from('tournaments').update(clean).eq('id', modal.data.id)
    else { const { error } = await supabase.from('tournaments').insert([clean]); if (error) throw error }
  }
  async function deleteTournament(id) {
    if (!confirm('Turnuva ve tüm verileri silinecek. Emin misiniz?')) return
    await supabase.from('tournaments').delete().eq('id', id)
  }
  async function togglePublish(t) {
    await supabase.from('tournaments').update({ published: !t.published }).eq('id', t.id)
  }
  async function saveTeam(data) {
    const clean = pick(data, ['tournament_id', 'name', 'logo_url'])
    if (modal?.data?.id) { const { error } = await supabase.from('teams').update(clean).eq('id', modal.data.id); if (error) throw error }
    else { const { error } = await supabase.from('teams').insert([clean]); if (error) throw error }
  }
  async function deleteTeam(id) {
    if (!confirm('Takım ve oyuncuları silinecek.')) return
    await supabase.from('teams').delete().eq('id', id)
  }
  async function savePlayer(data) {
    const clean = pick(data, ['team_id', 'name', 'number', 'position', 'photo_url'])
    if (clean.number !== undefined) clean.number = clean.number ? parseInt(clean.number) : null
    if (modal?.data?.id) { const { error } = await supabase.from('players').update(clean).eq('id', modal.data.id); if (error) throw error }
    else { const { error } = await supabase.from('players').insert([clean]); if (error) throw error }
  }
  async function deletePlayer(id) {
    if (!confirm('Oyuncuyu sil?')) return
    await supabase.from('players').delete().eq('id', id)
  }
  async function saveFixture(data) {
    const clean = pick(data, ['tournament_id', 'home_team_id', 'away_team_id', 'home_score', 'away_score', 'match_date', 'round', 'venue', 'status'])
    if (clean.home_score !== undefined) clean.home_score = clean.home_score !== '' ? parseInt(clean.home_score) : null
    if (clean.away_score !== undefined) clean.away_score = clean.away_score !== '' ? parseInt(clean.away_score) : null
    if (clean.match_date === '') clean.match_date = null
    if (modal?.data?.id) { const { error } = await supabase.from('fixtures').update(clean).eq('id', modal.data.id); if (error) throw error }
    else { const { error } = await supabase.from('fixtures').insert([clean]); if (error) throw error }
  }
  async function deleteFixture(id) {
    if (!confirm('Fikstürü sil?')) return
    await supabase.from('fixtures').delete().eq('id', id)
  }

  // Standings calculation
  function calcStandings(tournamentId) {
    const teams = allTeams.filter(t => t.tournament_id === tournamentId)
    const fixtures = allFixtures.filter(f => f.tournament_id === tournamentId && f.status === 'completed')
    const map = {}
    teams.forEach(t => { map[t.id] = { ...t, played: 0, won: 0, lost: 0, sets_for: 0, sets_against: 0, points: 0 } })
    fixtures.forEach(f => {
      const hs = f.home_score ?? 0, as = f.away_score ?? 0
      if (map[f.home_team_id]) {
        map[f.home_team_id].played++; map[f.home_team_id].sets_for += hs; map[f.home_team_id].sets_against += as
        if (hs > as) { map[f.home_team_id].won++; map[f.home_team_id].points += 3 }
        else { map[f.home_team_id].lost++ }
      }
      if (map[f.away_team_id]) {
        map[f.away_team_id].played++; map[f.away_team_id].sets_for += as; map[f.away_team_id].sets_against += hs
        if (as > hs) { map[f.away_team_id].won++; map[f.away_team_id].points += 3 }
        else { map[f.away_team_id].lost++ }
      }
    })
    return Object.values(map).sort((a, b) => b.points - a.points || b.won - a.won)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Turnuvalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tournaments.length} turnuva</p>
        </div>
        <button onClick={() => setModal({ type: 'tournament' })}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
          <FaPlus size={13} /> Yeni Turnuva
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz turnuva eklenmemiş.</div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => {
            const tTeams = allTeams.filter(x => x.tournament_id === t.id)
            const tFixtures = allFixtures.filter(x => x.tournament_id === t.id)
            const isOpen = expanded === t.id

            return (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Turnuva başlığı */}
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleExpand(t.id)} className="flex-1 flex items-center gap-3 text-left">
                    {isOpen ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
                    <div>
                      <div className="font-bold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {tTeams.length} takım · {tFixtures.length} maç ·
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-semibold ${t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700'}`}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => togglePublish(t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.published ? 'Yayında' : 'Taslak'}
                  </button>
                  <button onClick={() => setModal({ type: 'tournament', data: t })} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg"><FaEdit size={14} /></button>
                  <button onClick={() => deleteTournament(t.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><FaTrash size={14} /></button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100">
                    {/* Tab menü */}
                    <div className="flex border-b border-slate-100 px-4">
                      {[['teams', FaUsers, 'Takımlar'], ['fixtures', FaFutbol, 'Fikstür'], ['standings', FaTable, 'Puan Durumu']].map(([key, Icon, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                          <Icon size={13} /> {label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      {/* TAKIMLAR */}
                      {activeTab === 'teams' && (
                        <div>
                          <button onClick={() => setModal({ type: 'team', tournamentId: t.id })}
                            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium mb-4">
                            <FaPlus size={11} /> Takım Ekle
                          </button>
                          <div className="space-y-4">
                            {tTeams.map(team => {
                              const teamPlayers = allPlayers.filter(p => p.team_id === team.id)
                              return (
                                <div key={team.id} className="border border-slate-100 rounded-xl overflow-hidden">
                                  <div className="flex items-center gap-3 p-3 bg-slate-50">
                                    {team.logo_url ? <img src={team.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"><FaVolleyballBall className="text-primary-400" size={14} /></div>}
                                    <span className="font-semibold text-slate-800 flex-1">{team.name}</span>
                                    <span className="text-xs text-slate-400">{teamPlayers.length} oyuncu</span>
                                    <button onClick={() => setModal({ type: 'player', teamId: team.id })} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-2 py-1 bg-primary-50 rounded-lg"><FaPlus size={10} /> Oyuncu</button>
                                    <button onClick={() => setModal({ type: 'team', data: team, tournamentId: t.id })} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded"><FaEdit size={13} /></button>
                                    <button onClick={() => deleteTeam(team.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded"><FaTrash size={13} /></button>
                                  </div>
                                  {teamPlayers.length > 0 && (
                                    <table className="w-full text-xs">
                                      <thead className="bg-white border-b border-slate-100">
                                        <tr>
                                          <th className="text-left px-3 py-2 text-slate-500">#</th>
                                          <th className="text-left px-3 py-2 text-slate-500">Oyuncu</th>
                                          <th className="text-left px-3 py-2 text-slate-500 hidden sm:table-cell">Pozisyon</th>
                                          <th className="text-right px-3 py-2 text-slate-500"></th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {teamPlayers.map(p => (
                                          <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 text-slate-400 w-8">{p.number ?? '-'}</td>
                                            <td className="px-3 py-2 font-medium text-slate-700">{p.name}</td>
                                            <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{p.position}</td>
                                            <td className="px-3 py-2 text-right">
                                              <div className="flex justify-end gap-1">
                                                <button onClick={() => setModal({ type: 'player', data: p, teamId: p.team_id })} className="text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded"><FaEdit size={11} /></button>
                                                <button onClick={() => deletePlayer(p.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><FaTrash size={11} /></button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )
                            })}
                            {tTeams.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Henüz takım eklenmemiş.</p>}
                          </div>
                        </div>
                      )}

                      {/* FİKSTÜR */}
                      {activeTab === 'fixtures' && (
                        <div>
                          <button onClick={() => setModal({ type: 'fixture', tournamentId: t.id, teams: tTeams })}
                            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium mb-4">
                            <FaPlus size={11} /> Maç Ekle
                          </button>
                          <div className="space-y-2">
                            {tFixtures.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Henüz maç eklenmemiş.</p>}
                            {tFixtures.map(f => {
                              const home = allTeams.find(x => x.id === f.home_team_id)
                              const away = allTeams.find(x => x.id === f.away_team_id)
                              return (
                                <div key={f.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                                      <span>{home?.name ?? '?'}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${f.status === 'completed' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {f.status === 'completed' ? `${f.home_score ?? '-'} - ${f.away_score ?? '-'}` : 'vs'}
                                      </span>
                                      <span>{away?.name ?? '?'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      {f.round && <span className="mr-2">{f.round}</span>}
                                      {f.match_date && <span>{formatDt(f.match_date)}</span>}
                                      {f.venue && <span className="ml-2">📍 {f.venue}</span>}
                                    </div>
                                  </div>
                                  <button onClick={() => setModal({ type: 'fixture', data: f, tournamentId: t.id, teams: tTeams })} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg"><FaEdit size={13} /></button>
                                  <button onClick={() => deleteFixture(f.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><FaTrash size={13} /></button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* PUAN DURUMU */}
                      {activeTab === 'standings' && (
                        <div>
                          <p className="text-xs text-slate-400 mb-3">Tamamlanan maçlardan otomatik hesaplanır. Galibiyet = 3 puan.</p>
                          {tTeams.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">Önce takım ekleyin.</p> : (
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 rounded-lg">
                                <tr>
                                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Takım</th>
                                  <th className="text-center px-2 py-2 font-semibold text-slate-600">O</th>
                                  <th className="text-center px-2 py-2 font-semibold text-slate-600">G</th>
                                  <th className="text-center px-2 py-2 font-semibold text-slate-600">M</th>
                                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Set A/Y</th>
                                  <th className="text-center px-2 py-2 font-semibold text-slate-600">P</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {calcStandings(t.id).map((s, i) => (
                                  <tr key={s.id} className={i === 0 ? 'bg-yellow-50' : 'hover:bg-slate-50'}>
                                    <td className="px-3 py-2.5 flex items-center gap-2">
                                      <span className="text-slate-400 w-4 text-xs">{i + 1}</span>
                                      {s.logo_url ? <img src={s.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" /> : null}
                                      <span className="font-medium text-slate-800">{s.name}</span>
                                    </td>
                                    <td className="text-center px-2 py-2.5 text-slate-600">{s.played}</td>
                                    <td className="text-center px-2 py-2.5 text-green-600 font-semibold">{s.won}</td>
                                    <td className="text-center px-2 py-2.5 text-red-500">{s.lost}</td>
                                    <td className="text-center px-2 py-2.5 text-slate-500">{s.sets_for}/{s.sets_against}</td>
                                    <td className="text-center px-2 py-2.5 font-extrabold text-primary-700">{s.points}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODALLER */}
      {modal?.type === 'tournament' && (
        <Modal title={modal.data ? 'Turnuvayı Düzenle' : 'Yeni Turnuva'} onClose={() => setModal(null)}>
          <TournamentForm initial={modal.data} onSave={saveTournament} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'team' && (
        <Modal title={modal.data ? 'Takımı Düzenle' : 'Yeni Takım'} onClose={() => setModal(null)}>
          <TeamForm tournamentId={modal.tournamentId} initial={modal.data} onSave={saveTeam} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'player' && (
        <Modal title={modal.data ? 'Oyuncuyu Düzenle' : 'Oyuncu Ekle'} onClose={() => setModal(null)}>
          <PlayerForm teamId={modal.teamId} initial={modal.data} onSave={savePlayer} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'fixture' && (
        <Modal title={modal.data ? 'Maçı Düzenle' : 'Maç Ekle'} onClose={() => setModal(null)}>
          <FixtureForm tournamentId={modal.tournamentId} teams={modal.teams} initial={modal.data} onSave={saveFixture} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}

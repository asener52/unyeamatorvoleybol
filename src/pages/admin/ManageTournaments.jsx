import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadFile } from '../../lib/supabase'
import { useCollection } from '../../hooks/useFirestore'
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaChevronDown, FaChevronUp,
  FaUsers, FaFutbol, FaTable, FaImage, FaVolleyballBall, FaSearch, FaUserPlus
} from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const POSITIONS = [
  'Pasör (Setter)',
  'Pasör Çaprazı (Opposite)',
  'Smaçör (Outside Hitter)',
  'Orta Oyuncu / Orta Blokçu (Middle Blocker)',
  'Libero',
  'Defans Uzmanı',
]
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

// ─── Üyelerden oyuncu seçimi ───────────────────────────────────────────────
function MemberSelectForm({ teamId, tournamentId, allTeams, allPlayers, onSave, onClose }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)

  // Bu turnuvadaki tüm takımlara kayıtlı oyuncu adlarını bul
  const tournamentTeamIds = allTeams.filter(t => t.tournament_id === tournamentId).map(t => t.id)
  const assignedNames = new Set(
    allPlayers
      .filter(p => tournamentTeamIds.includes(p.team_id))
      .map(p => p.name?.toLowerCase())
  )

  useEffect(() => {
    supabase.from('members').select('id, name, phone, position, role')
      .eq('status', 'approved').order('name')
      .then(({ data }) => { setMembers(data || []); setLoading(false) })
  }, [])

  const filtered = members.filter(m =>
    !assignedNames.has(m.name?.toLowerCase()) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSave() {
    if (!selected.length) { alert('En az bir üye seçin.'); return }
    setSaving(true)
    try {
      const rows = members
        .filter(m => selected.includes(m.id))
        .map(m => ({ team_id: teamId, name: m.name, position: m.position || '', number: null }))
      const { error } = await supabase.from('players').insert(rows)
      if (error) throw error
      onSave(); onClose()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Üye ara..."
          className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          {search ? 'Sonuç bulunamadı.' : 'Eklenebilecek üye yok (tüm üyeler zaten takımlarda).'}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtered.map(m => {
            const isSelected = selected.includes(m.id)
            return (
              <label key={m.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-slate-50'}`}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(m.id)}
                  className="w-4 h-4 rounded accent-primary-600" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                  {m.position && <div className="text-xs text-slate-400 truncate">{m.position}</div>}
                </div>
                <span className="text-xs text-slate-400">{m.phone}</span>
              </label>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="text-xs text-primary-700 bg-primary-50 px-3 py-2 rounded-lg font-medium">
          {selected.length} üye seçildi
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleSave} disabled={saving || !selected.length}
          className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
          {saving ? 'Ekleniyor...' : 'Takıma Ekle'}
        </button>
        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">İptal</button>
      </div>
    </div>
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
const VALID_SCORES = ['3-0','3-1','3-2','0-3','1-3','2-3']

function FixtureForm({ tournamentId, teams, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    home_team_id: initial?.home_team_id || '',
    away_team_id: initial?.away_team_id || '',
    match_date: initial?.match_date ? initial.match_date.slice(0, 16) : '',
    round: initial?.round || '',
    venue: initial?.venue || '',
    home_score: initial?.home_score?.toString() ?? '',
    away_score: initial?.away_score?.toString() ?? '',
    set_details: initial?.set_details || '',
    status: initial?.status || 'scheduled',
  })
  const [saving, setSaving] = useState(false)

  const hs = parseInt(form.home_score), as = parseInt(form.away_score)
  const scoreKey = `${hs}-${as}`
  const scoreValid = VALID_SCORES.includes(scoreKey)
  const isTiebreak = scoreKey === '3-2' || scoreKey === '2-3'
  const homeWins = hs === 3
  const scoreSummary = scoreValid
    ? (homeWins
        ? `Ev sahibi kazandı · ${isTiebreak ? '2 puan (tie-break)' : '3 puan'}`
        : `Misafir kazandı · ${isTiebreak ? '2 puan (tie-break)' : '3 puan'}`)
    : (form.home_score !== '' && form.away_score !== '') ? '⚠ Geçersiz skor (3-0, 3-1, 3-2, 0-3, 1-3, 2-3 olmalı)' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.status === 'completed' && !scoreValid) { alert('Lütfen geçerli bir set skoru girin (3-0, 3-1, 3-2 veya tersi)'); return }
    setSaving(true)
    try {
      await onSave({ ...form, tournament_id: tournamentId,
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

      {/* Set skoru */}
      <div>
        <label className="text-xs text-slate-500 mb-2 block font-medium">Set Skoru (kazanan takım 3 set alır)</label>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div>
            <div className="text-xs text-center text-slate-400 mb-1">Ev</div>
            <div className="flex justify-center gap-1">
              {[0,1,2,3].map(n => (
                <button key={n} type="button"
                  onClick={() => setForm(f => ({ ...f, home_score: n.toString(), status: (n === 3 || parseInt(f.away_score) === 3) ? 'completed' : f.status }))}
                  className={`w-9 h-9 rounded-lg font-bold text-sm border-2 transition-all ${parseInt(form.home_score) === n ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="text-slate-400 font-bold text-lg text-center">-</div>
          <div>
            <div className="text-xs text-center text-slate-400 mb-1">Misafir</div>
            <div className="flex justify-center gap-1">
              {[0,1,2,3].map(n => (
                <button key={n} type="button"
                  onClick={() => setForm(f => ({ ...f, away_score: n.toString(), status: (parseInt(f.home_score) === 3 || n === 3) ? 'completed' : f.status }))}
                  className={`w-9 h-9 rounded-lg font-bold text-sm border-2 transition-all ${parseInt(form.away_score) === n ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        {scoreSummary && (
          <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${scoreValid ? (isTiebreak ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700') : 'bg-red-50 text-red-600'}`}>
            {scoreSummary}
          </div>
        )}
      </div>

      {/* Set detayları */}
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Set Detayları <span className="text-slate-400">(isteğe bağlı — örn: 25-20, 25-18, 25-22)</span></label>
        <input value={form.set_details} onChange={e => setForm(f => ({ ...f, set_details: e.target.value }))}
          placeholder="25-20, 25-18, 25-22" className={inp} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))} placeholder="Tur (örn: Hafta 1)" className={inp} />
        <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Konum/Salon" className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-500 mb-1 block">Tarih/Saat</label>
          <input type="datetime-local" value={form.match_date} onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))} className={inp} /></div>
        <div><label className="text-xs text-slate-500 mb-1 block">Durum</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
            <option value="scheduled">Planlandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
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
    const clean = pick(data, ['tournament_id', 'home_team_id', 'away_team_id', 'home_score', 'away_score', 'set_details', 'match_date', 'round', 'venue', 'status'])
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

  // Voleybol puan kuralları: 3-0/3-1 → 3/0 puan, 3-2 → 2/1 puan
  function calcStandings(tournamentId) {
    const teams = allTeams.filter(t => t.tournament_id === tournamentId)
    const fixtures = allFixtures.filter(f => f.tournament_id === tournamentId && f.status === 'completed' && f.home_score != null && f.away_score != null)
    const map = {}
    teams.forEach(t => { map[t.id] = { ...t, played: 0, won: 0, lost: 0, sets_for: 0, sets_against: 0, points: 0 } })
    fixtures.forEach(f => {
      const hs = parseInt(f.home_score), as = parseInt(f.away_score)
      const isTiebreak = (hs === 3 && as === 2) || (hs === 2 && as === 3)
      const homeWon = hs > as
      if (map[f.home_team_id]) {
        map[f.home_team_id].played++
        map[f.home_team_id].sets_for += hs; map[f.home_team_id].sets_against += as
        if (homeWon) { map[f.home_team_id].won++; map[f.home_team_id].points += isTiebreak ? 2 : 3 }
        else { map[f.home_team_id].lost++; map[f.home_team_id].points += isTiebreak ? 1 : 0 }
      }
      if (map[f.away_team_id]) {
        map[f.away_team_id].played++
        map[f.away_team_id].sets_for += as; map[f.away_team_id].sets_against += hs
        if (!homeWon) { map[f.away_team_id].won++; map[f.away_team_id].points += isTiebreak ? 2 : 3 }
        else { map[f.away_team_id].lost++; map[f.away_team_id].points += isTiebreak ? 1 : 0 }
      }
    })
    return Object.values(map).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      const aRatio = a.sets_against > 0 ? a.sets_for / a.sets_against : a.sets_for
      const bRatio = b.sets_against > 0 ? b.sets_for / b.sets_against : b.sets_for
      return bRatio - aRatio
    })
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
                                    <button onClick={() => setModal({ type: 'memberSelect', teamId: team.id, tournamentId: t.id })} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 px-2 py-1 bg-green-50 rounded-lg"><FaUserPlus size={10} /> Üyeden</button>
                                    <button onClick={() => setModal({ type: 'player', teamId: team.id })} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 px-2 py-1 bg-primary-50 rounded-lg"><FaPlus size={10} /> Manuel</button>
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
                              const done = f.status === 'completed'
                              const hs = f.home_score, as = f.away_score
                              const homeWon = done && hs > as
                              const isTB = done && ((hs === 3 && as === 2) || (hs === 2 && as === 3))
                              return (
                                <div key={f.id} className={`flex items-center gap-3 p-3 border rounded-xl ${done ? 'border-slate-200 bg-slate-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className={`flex-1 text-right font-semibold truncate ${done && homeWon ? 'text-primary-700' : 'text-slate-700'}`}>{home?.name ?? '?'}</span>
                                      {done ? (
                                        <span className="shrink-0 bg-slate-800 text-white px-2.5 py-1 rounded-lg font-extrabold text-sm tracking-wider">
                                          {hs} – {as}
                                        </span>
                                      ) : (
                                        <span className="shrink-0 text-slate-400 text-xs font-semibold px-2">vs</span>
                                      )}
                                      <span className={`flex-1 font-semibold truncate ${done && !homeWon ? 'text-primary-700' : 'text-slate-700'}`}>{away?.name ?? '?'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                                      {done && isTB && <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-semibold">Tie-break</span>}
                                      {done && <span className={`px-1.5 py-0.5 rounded font-semibold ${homeWon ? 'bg-primary-50 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{homeWon ? home?.name : away?.name} kazandı</span>}
                                      {f.set_details && <span className="text-slate-400">🏐 {f.set_details}</span>}
                                      {f.round && <span>{f.round}</span>}
                                      {f.match_date && <span>{formatDt(f.match_date)}</span>}
                                      {f.venue && <span>📍 {f.venue}</span>}
                                    </div>
                                  </div>
                                  <button onClick={() => setModal({ type: 'fixture', data: f, tournamentId: t.id, teams: tTeams })} className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg shrink-0"><FaEdit size={13} /></button>
                                  <button onClick={() => deleteFixture(f.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg shrink-0"><FaTrash size={13} /></button>
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
      {modal?.type === 'memberSelect' && (
        <Modal title="Üyelerden Oyuncu Seç" onClose={() => setModal(null)}>
          <MemberSelectForm
            teamId={modal.teamId}
            tournamentId={modal.tournamentId}
            allTeams={allTeams}
            allPlayers={allPlayers}
            onSave={() => {}}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'player' && (
        <Modal title={modal.data ? 'Oyuncuyu Düzenle' : 'Manuel Oyuncu Ekle'} onClose={() => setModal(null)}>
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

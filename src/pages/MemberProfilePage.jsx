import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMember } from '../contexts/MemberAuthContext'
import { supabase } from '../lib/supabase'
import { hashPassword } from '../lib/crypto'
import {
  FaVolleyballBall, FaPhone, FaEnvelope, FaSignOutAlt, FaComments,
  FaUser, FaEdit, FaCheck, FaTimes, FaLock, FaEye, FaEyeSlash,
  FaCamera, FaCalendarAlt, FaClock, FaTimesCircle, FaStar, FaShieldAlt,
  FaBriefcase, FaBirthdayCake,
} from 'react-icons/fa'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

const POSITIONS = [
  'Pasör (Setter)', 'Pasör Çaprazı (Opposite)', 'Smaçör (Outside Hitter)',
  'Orta Oyuncu / Orta Blokçu (Middle Blocker)', 'Libero', 'Defans Uzmanı', 'Seyirci',
]

const POS_COLOR = {
  'Pasör (Setter)': 'bg-blue-100 text-blue-700',
  'Pasör Çaprazı (Opposite)': 'bg-indigo-100 text-indigo-700',
  'Smaçör (Outside Hitter)': 'bg-green-100 text-green-700',
  'Orta Oyuncu / Orta Blokçu (Middle Blocker)': 'bg-orange-100 text-orange-700',
  'Libero': 'bg-purple-100 text-purple-700',
  'Defans Uzmanı': 'bg-cyan-100 text-cyan-700',
}

const STATUS_CONFIG = {
  bekliyor:    { label: 'Bekliyor',    cls: 'bg-yellow-100 text-yellow-700', icon: FaClock },
  as_kadro:    { label: 'As Kadro',    cls: 'bg-green-100 text-green-700',   icon: FaStar },
  yedek_kadro: { label: 'Yedek Kadro',cls: 'bg-blue-100 text-blue-700',     icon: FaShieldAlt },
  reddedildi:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-700',       icon: FaTimesCircle },
  iptal:       { label: 'İptal Edildi',cls: 'bg-slate-100 text-slate-500',   icon: FaTimesCircle },
}

function formatEventDate(d) {
  if (!d) return ''
  try { return format(new Date(d), 'd MMMM yyyy', { locale: tr }) } catch { return d }
}

function formatBirthDate(d) {
  if (!d) return ''
  try { return format(parseISO(String(d).slice(0, 10)), 'd MMMM yyyy', { locale: tr }) } catch { return d }
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
        </button>
      </div>
    </div>
  )
}

async function uploadAvatar(memberId, file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const path = `${memberId}${ext}`
  const { data, error } = await supabase.storage
    .from('avatars').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
  return urlData.publicUrl + '?t=' + Date.now()
}

export default function MemberProfilePage() {
  const { member, updateSession, logout } = useMember()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState('info')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', position: '', team: '', birthDate: '', occupation: '',
  })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Etkinliklerim
  const [requests, setRequests] = useState([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    if (!member) return
    supabase
      .from('match_requests')
      .select('id, event_title, event_date, type, status, created_at')
      .eq('member_id', member.id)
      .order('event_date', { ascending: false })
      .then(({ data }) => { setRequests(data || []); setLoadingReq(false) })
  }, [member?.id])

  if (!member) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
        <div>
          <FaUser className="text-slate-300 text-5xl mx-auto mb-4" />
          <p className="text-slate-600 font-semibold mb-3">Profili görmek için giriş yapmalısınız.</p>
          <Link to="/uye-giris"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Üye Girişi
          </Link>
        </div>
      </div>
    )
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Lütfen bir görsel dosyası seçin.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Dosya boyutu 5 MB\'ı geçemez.'); return }
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(member.id, file)
      await supabase.from('members').update({ avatar_url: url }).eq('id', member.id)
      updateSession({ avatar_url: url })
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  function openEdit() {
    setForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      position: member.position || POSITIONS[0],
      team: member.team || '',
      birthDate: member.birth_date ? String(member.birth_date).slice(0, 10) : '',
      occupation: member.occupation || '',
    })
    setPwForm({ current: '', next: '', confirm: '' })
    setError(''); setSuccess(''); setTab('info'); setEditing(true)
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true); setError('')
    try {
      const newPhone = form.phone.trim()
      if (newPhone !== member.phone) {
        const { data: existing } = await supabase.from('members').select('id').eq('phone', newPhone).limit(1)
        if (existing?.length > 0) { setError('Bu telefon numarası başka bir üyeye ait.'); setSaving(false); return }
      }
      const profileUpdate = {
        name: form.name.trim(), phone: newPhone,
        email: form.email.trim() || null,
        position: form.position,
        team: form.team?.trim() || null,
        birth_date: form.birthDate || null,
        occupation: form.occupation.trim() || null,
      }
      const { error: err } = await supabase.from('members').update(profileUpdate).eq('id', member.id)
      if (err) throw err
      updateSession(profileUpdate)
      setEditing(false)
    } catch (err) {
      setError('Hata: ' + err.message)
    } finally { setSaving(false) }
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    if (!pwForm.current) { setError('Mevcut şifrenizi girin.'); return }
    if (pwForm.next.length < 6) { setError('Yeni şifre en az 6 karakter olmalıdır.'); return }
    if (pwForm.next !== pwForm.confirm) { setError('Yeni şifreler eşleşmiyor.'); return }
    setSaving(true); setError('')
    try {
      const currentHash = await hashPassword(pwForm.current)
      const { data, error: checkErr } = await supabase.from('members').select('id').eq('id', member.id).eq('password_hash', currentHash).single()
      if (checkErr || !data) { setError('Mevcut şifre hatalı.'); setSaving(false); return }
      const newHash = await hashPassword(pwForm.next)
      const { error: updateErr } = await supabase.from('members').update({ password_hash: newHash }).eq('id', member.id)
      if (updateErr) throw updateErr
      setSuccess('Şifreniz başarıyla güncellendi.')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError('Hata: ' + err.message)
    } finally { setSaving(false) }
  }

  async function handleCancel(req) {
    if (!confirm(`"${req.event_title}" etkinliğine katılımınızı iptal etmek istediğinizden emin misiniz?`)) return
    setCancellingId(req.id)
    await supabase.from('match_requests').update({ status: 'iptal' }).eq('id', req.id)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'iptal' } : r))
    setCancellingId(null)
  }

  function handleLogout() { logout(); navigate('/') }

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const posColor = POS_COLOR[member.position] || 'bg-slate-100 text-slate-600'

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Avatar + isim */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl p-8 text-white text-center mb-6">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center mx-auto">
            {member.avatar_url
              ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-extrabold">{initials}</span>}
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-primary-700 flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors disabled:opacity-60"
            title="Fotoğraf değiştir">
            {uploadingAvatar
              ? <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              : <FaCamera size={13} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <h1 className="text-2xl font-extrabold">{member.name}</h1>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${posColor}`}>
          {member.position || 'Üye'}
        </span>
        <p className="text-white/50 text-xs mt-2">Fotoğrafı değiştirmek için kamera ikonuna tıklayın</p>
      </div>

      {/* Bilgiler */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 mb-4">
        <div className="flex items-center gap-3 px-5 py-4">
          <FaPhone className="text-primary-500 shrink-0" size={15} />
          <div><div className="text-xs text-slate-400">Telefon</div>
            <div className="font-semibold text-slate-800">{member.phone}</div></div>
        </div>
        {member.email && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FaEnvelope className="text-primary-500 shrink-0" size={15} />
            <div><div className="text-xs text-slate-400">E-posta</div>
              <div className="font-semibold text-slate-800">{member.email}</div></div>
          </div>
        )}
        {member.birth_date && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FaBirthdayCake className="text-primary-500 shrink-0" size={15} />
            <div><div className="text-xs text-slate-400">Doğum Tarihi</div>
              <div className="font-semibold text-slate-800">{formatBirthDate(member.birth_date)}</div></div>
          </div>
        )}
        {member.occupation && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FaBriefcase className="text-primary-500 shrink-0" size={15} />
            <div><div className="text-xs text-slate-400">Meslek</div>
              <div className="font-semibold text-slate-800">{member.occupation}</div></div>
          </div>
        )}
        {member.team && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FaVolleyballBall className="text-gold-500 shrink-0" size={15} />
            <div><div className="text-xs text-slate-400">Takım</div>
              <div className="font-semibold text-slate-800">{member.team}</div></div>
          </div>
        )}
        <div className="flex items-center gap-3 px-5 py-4">
          <FaVolleyballBall className="text-gold-500 shrink-0" size={15} />
          <div><div className="text-xs text-slate-400">Üyelik Durumu</div>
            <div className="font-semibold text-green-600">Onaylı Üye</div></div>
        </div>
      </div>

      {/* Etkinliklerim */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10)
        const upcoming = requests.filter(r => !r.event_date || r.event_date >= today)
        const past     = requests.filter(r => r.event_date && r.event_date < today)

        function RequestCard({ req, isPast }) {
          const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.bekliyor
          const StatusIcon = st.icon
          const canCancel = !isPast && req.status !== 'iptal' && req.status !== 'reddedildi'
          return (
            <div className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 ${isPast ? 'border-slate-100 opacity-75' : 'border-slate-100'}`}>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm truncate ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>
                  {req.event_title || 'Etkinlik'}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {req.event_date && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <FaCalendarAlt size={10} /> {formatEventDate(req.event_date)}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    req.type === 'oyuncu' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {req.type === 'oyuncu' ? 'Oyuncu' : 'Seyirci'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>
                  <StatusIcon size={10} /> {st.label}
                </span>
                {canCancel && (
                  <button onClick={() => handleCancel(req)} disabled={cancellingId === req.id}
                    title="Katılımı iptal et"
                    className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    {cancellingId === req.id
                      ? <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" />
                      : <FaTimesCircle size={14} />}
                  </button>
                )}
              </div>
            </div>
          )
        }

        return (
          <>
            {/* Yaklaşan / Aktif */}
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FaCalendarAlt className="text-primary-500" size={15} /> Etkinliklerim
              </h2>
              {loadingReq ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 px-5 py-6 text-center text-slate-400 text-sm">
                  Yaklaşan etkinlik başvurunuz yok.
                  <Link to="/mac-kayit" className="block mt-2 text-primary-600 hover:text-primary-800 font-semibold text-sm">
                    Maça Katıl →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(req => <RequestCard key={req.id} req={req} isPast={false} />)}
                </div>
              )}
            </div>

            {/* Geçmiş */}
            {!loadingReq && past.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowPast(s => !s)}
                  className="w-full flex items-center justify-between text-base font-bold text-slate-500 mb-3 hover:text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FaClock size={14} className="text-slate-400" /> Geçmiş Etkinliklerim
                    <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{past.length}</span>
                  </span>
                  <span className="text-xs text-slate-400">{showPast ? '▲ Gizle' : '▼ Göster'}</span>
                </button>
                {showPast && (
                  <div className="space-y-2">
                    {past.map(req => <RequestCard key={req.id} req={req} isPast={true} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )
      })()}

      <button onClick={openEdit}
        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors mb-3">
        <FaEdit size={14} /> Profili Düzenle
      </button>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Link to="/mesajlar"
          className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          <FaComments size={15} /> Mesajlar
        </Link>
        <Link to="/anketler"
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
          <FaVolleyballBall size={15} /> Anketler
        </Link>
      </div>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl text-sm transition-colors">
        <FaSignOutAlt size={14} /> Çıkış Yap
      </button>

      {/* Düzenleme Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-slate-800">Profili Düzenle</h2>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
            </div>
            <div className="flex border-b border-slate-100">
              {[['info', FaUser, 'Bilgiler'], ['password', FaLock, 'Şifre']].map(([key, Icon, label]) => (
                <button key={key} onClick={() => { setTab(key); setError(''); setSuccess('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            <div className="p-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2"><FaCheck size={13} />{success}</div>}

              {tab === 'info' ? (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Ad Soyad *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Telefon</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+905XXXXXXXXX"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">E-posta</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="ornek@email.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Doğum Tarihi <span className="text-slate-300">(isteğe bağlı)</span></label>
                    <input type="date" value={form.birthDate}
                      onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Meslek <span className="text-slate-300">(isteğe bağlı)</span></label>
                    <input value={form.occupation}
                      onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                      placeholder="Örn: Öğretmen, Mühendis, Esnaf…"
                      maxLength={100}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Takım <span className="text-slate-300">(isteğe bağlı)</span></label>
                    <input value={form.team || ''} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                      placeholder="Örn: Sağlıkçılar, Belediyespor…"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Pozisyon</label>
                    <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {POSITIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <PasswordInput label="Mevcut Şifre" value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="Mevcut şifreniz" />
                  <PasswordInput label="Yeni Şifre (en az 6 karakter)" value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="Yeni şifreniz" />
                  <PasswordInput label="Yeni Şifre Tekrar" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Yeni şifrenizi tekrar girin" />
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
                      {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">
                      İptal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

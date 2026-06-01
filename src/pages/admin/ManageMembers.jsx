import { useState } from 'react'
import { useCollection, deleteDocument } from '../../hooks/useFirestore'
import { supabase } from '../../lib/supabase'
import { hashPassword } from '../../lib/crypto'
import { FaTrash, FaCheck, FaTimes, FaPhone, FaEnvelope, FaUser, FaEdit, FaLock } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy', { locale: tr }) } catch { return '' }
}

const STATUS = {
  bekliyor:  { label: 'Bekliyor',   cls: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Onaylandı',  cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
}

const ROLES = {
  uye:              'Üye',
  kaptan:           'Kaptan',
  koordinator:      'Koordinatör',
  yardimci_yonetici:'Yardımcı Yönetici',
}

const ROLE_CLS = {
  uye:              'bg-slate-100 text-slate-600',
  kaptan:           'bg-blue-100 text-blue-700',
  koordinator:      'bg-purple-100 text-purple-700',
  yardimci_yonetici:'bg-orange-100 text-orange-700',
}

const POSITIONS = [
  'Pasör (Setter)',
  'Pasör Çaprazı (Opposite)',
  'Smaçör (Outside Hitter)',
  'Orta Oyuncu / Orta Blokçu (Middle Blocker)',
  'Libero',
  'Defans Uzmanı',
  'Seyirci',
]

const inp = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

function EditModal({ member, onClose }) {
  const [form, setForm] = useState({
    name: member.name || '',
    phone: member.phone || '',
    email: member.email || '',
    position: member.position || '',
    role: member.role || 'uye',
    status: member.status || 'bekliyor',
  })
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info') // info | password

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const update = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        position: form.position,
        role: form.role,
        status: form.status,
      }
      if (tab === 'password' && newPassword) {
        if (newPassword.length < 6) { alert('Şifre en az 6 karakter olmalı'); setSaving(false); return }
        update.password_hash = await hashPassword(newPassword)
      }
      const { error } = await supabase.from('members').update(update).eq('id', member.id)
      if (error) throw error
      onClose()
    } catch (err) {
      alert('Hata: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-slate-800">Üye Düzenle — {member.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><FaTimes /></button>
        </div>

        <div className="flex border-b border-slate-100">
          {[['info', FaUser, 'Bilgiler'], ['password', FaLock, 'Şifre']].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3">
          {tab === 'info' ? (
            <>
              <div><label className="text-xs text-slate-500 mb-1 block">Ad Soyad</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Telefon</label>
                <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">E-posta</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Pozisyon</label>
                <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp}>
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 mb-1 block">Rol</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inp}>
                    {Object.entries(ROLES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select></div>
                <div><label className="text-xs text-slate-500 mb-1 block">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                    <option value="bekliyor">Bekliyor</option>
                    <option value="approved">Onaylandı</option>
                    <option value="rejected">Reddedildi</option>
                  </select></div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Yeni Şifre (en az 6 karakter)</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Boş bırakırsanız şifre değişmez" className={inp} />
              <p className="text-xs text-slate-400 mt-2">Üyenin mevcut şifresini sıfırlayarak yenisini belirleyebilirsiniz.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManageMembers() {
  const { docs, loading } = useCollection('members', 'created_at', 200)
  const [editMember, setEditMember] = useState(null)
  const [filter, setFilter] = useState('hepsi')

  const counts = {
    bekliyor: docs.filter(d => d.status === 'bekliyor').length,
    approved: docs.filter(d => d.status === 'approved').length,
  }

  const filtered = filter === 'hepsi' ? docs : docs.filter(d => d.status === filter)

  async function setStatus(id, status) {
    const { error } = await supabase.from('members').update({ status }).eq('id', id)
    if (error) alert('Hata: ' + error.message)
  }

  async function handleDelete(id) {
    if (!confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) return
    await deleteDocument('members', id)
  }

  return (
    <div>
      {editMember && <EditModal member={editMember} onClose={() => setEditMember(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Üye Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-0.5">{docs.length} üye</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-yellow-600">{counts.bekliyor}</div>
          <div className="text-xs text-slate-500 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600">{counts.approved}</div>
          <div className="text-xs text-slate-500 mt-0.5">Onaylı</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-slate-700">{docs.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Toplam</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[['hepsi','Tümü'],['bekliyor','Bekleyenler'],['approved','Onaylılar'],['rejected','Reddedilenler']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === val ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Üye bulunamadı.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">İletişim</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Pozisyon / Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(d => {
                const st = STATUS[d.status] || STATUS.bekliyor
                const roleCls = ROLE_CLS[d.role] || ROLE_CLS.uye
                const roleLabel = ROLES[d.role] || 'Üye'
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                          {d.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        <a href={`tel:${d.phone}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs">
                          <FaPhone size={10} /> {d.phone}
                        </a>
                        {d.email && <a href={`mailto:${d.email}`} className="flex items-center gap-1 text-slate-500 text-xs">
                          <FaEnvelope size={10} /> {d.email}
                        </a>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 truncate max-w-[160px]">{d.position}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleCls}`}>{roleLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.status !== 'approved' && (
                          <button onClick={() => setStatus(d.id, 'approved')} title="Onayla"
                            className="text-green-500 hover:text-green-700 p-1.5 hover:bg-green-50 rounded-lg">
                            <FaCheck size={13} />
                          </button>
                        )}
                        {d.status !== 'rejected' && (
                          <button onClick={() => setStatus(d.id, 'rejected')} title="Reddet"
                            className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg">
                            <FaTimes size={13} />
                          </button>
                        )}
                        <button onClick={() => setEditMember(d)} title="Düzenle"
                          className="text-primary-600 hover:text-primary-800 p-1.5 hover:bg-primary-50 rounded-lg">
                          <FaEdit size={13} />
                        </button>
                        <button onClick={() => handleDelete(d.id)}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg">
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

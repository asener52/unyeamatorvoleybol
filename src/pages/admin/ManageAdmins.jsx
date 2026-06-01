import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FaUserShield, FaPlus, FaTrash, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy', { locale: tr }) } catch { return '' }
}

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    const { data } = await supabase.from('admin_users').select('*').order('created_at')
    setAdmins(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return }
    if (form.password !== form.confirmPassword) { setError('Şifreler eşleşmiyor.'); return }
    setSaving(true)
    try {
      // Supabase Auth'da kullanıcı oluştur
      const { error: authErr } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })
      if (authErr) throw authErr

      // admin_users tablosuna da kaydet
      const { error: dbErr } = await supabase.from('admin_users').insert([{ email: form.email.trim() }])
      if (dbErr && !dbErr.message.includes('duplicate')) throw dbErr

      await loadAdmins()
      setForm({ email: '', password: '', confirmPassword: '' })
      setSuccess(`${form.email} hesabı oluşturuldu. Kullanıcı e-posta doğrulaması gerekiyorsa Supabase Dashboard'dan devre dışı bırakın.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, email) {
    if (!confirm(`${email} yöneticisini kaldırmak istediğinizden emin misiniz?\n\nNot: Supabase Auth kaydı manuel silinmelidir.`)) return
    await supabase.from('admin_users').delete().eq('id', id)
    setAdmins(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Yönetici Hesapları</h1>
        <p className="text-slate-500 text-sm mt-0.5">Admin paneline erişebilecek kullanıcılar</p>
      </div>

      {/* Bilgi notu */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
        <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Yönetici hesabı nasıl çalışır?</p>
          <ul className="space-y-1 text-xs text-blue-600">
            <li>• Yeni hesap oluşturun — Supabase Auth'a kayıt olur.</li>
            <li>• E-posta doğrulaması devre dışıysa anında giriş yapabilir.</li>
            <li>• E-posta doğrulaması aktifse: Supabase Dashboard → Authentication → Users → kullanıcıyı "Confirm" edin.</li>
          </ul>
        </div>
      </div>

      {/* Yeni yönetici formu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FaPlus size={14} /> Yeni Yönetici Ekle</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="E-posta adresi"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Şifre (min. 6 karakter)"
                className="w-full pr-9 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
            <input required type={showPw ? 'text' : 'password'} value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Şifre tekrar"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
          <button type="submit" disabled={saving}
            className="bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {saving ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>
      </div>

      {/* Mevcut yöneticiler */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Kayıtlı Yöneticiler</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-200 animate-pulse rounded-lg" />)}</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">Kayıtlı yönetici bulunamadı.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600">E-posta</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 hidden sm:table-cell">Eklenme</th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <FaUserShield className="text-primary-500" size={15} />
                      <span className="font-medium text-slate-800">{a.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs hidden sm:table-cell">{formatDate(a.created_at)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(a.id, a.email)}
                      className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <FaTrash size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

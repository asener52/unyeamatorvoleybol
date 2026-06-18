import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMember } from '../contexts/MemberAuthContext'
import { supabase } from '../lib/supabase'
import { hashPassword } from '../lib/crypto'
import { FaVolleyballBall, FaPhone, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaKey, FaCheckCircle, FaArrowLeft } from 'react-icons/fa'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function MemberLoginPage() {
  const { login, member } = useMember()
  const navigate = useNavigate()

  // Giriş state
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Şifre sıfırlama state
  const [resetStep, setResetStep] = useState(0) // 0=giriş 1=telefon gir 2=kod+yeni şifre 3=tamam
  const [resetPhone, setResetPhone] = useState('')
  const [resetCode, setResetCode] = useState('')      // kullanıcıya gösterilen kod
  const [enteredCode, setEnteredCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetMemberId, setResetMemberId] = useState(null)

  if (member) {
    navigate('/profil', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(phone, password)
      navigate('/profil')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Adım 1: Telefon numarasını doğrula ve kod üret
  async function handleResetRequest(e) {
    e.preventDefault()
    setResetError(''); setResetLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('members')
        .select('id, name')
        .eq('phone', resetPhone.trim())
        .eq('status', 'approved')
        .single()
      if (err || !data) { setResetError('Bu telefon numarasıyla kayıtlı onaylı üye bulunamadı.'); setResetLoading(false); return }

      const code = generateCode()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 dk geçerli
      const codeHash = await hashPassword(code)

      await supabase.from('members').update({
        reset_token: codeHash,
        reset_token_expires_at: expiresAt,
      }).eq('id', data.id)

      setResetCode(code)
      setResetMemberId(data.id)
      setResetStep(2)
    } catch (err) {
      setResetError('Bir hata oluştu: ' + err.message)
    } finally {
      setResetLoading(false)
    }
  }

  // Adım 2: Kodu ve yeni şifreyi doğrula
  async function handleResetConfirm(e) {
    e.preventDefault()
    setResetError('')
    if (newPassword.length < 6) { setResetError('Şifre en az 6 karakter olmalıdır.'); return }
    if (newPassword !== confirmPassword) { setResetError('Şifreler eşleşmiyor.'); return }
    setResetLoading(true)
    try {
      const enteredHash = await hashPassword(enteredCode.trim())
      const { data, error: err } = await supabase
        .from('members')
        .select('reset_token, reset_token_expires_at')
        .eq('id', resetMemberId)
        .single()
      if (err || !data) throw new Error('Üye bulunamadı.')
      if (data.reset_token !== enteredHash) { setResetError('Doğrulama kodu hatalı.'); setResetLoading(false); return }
      if (new Date(data.reset_token_expires_at) < new Date()) { setResetError('Kod süresi dolmuş. Lütfen tekrar deneyin.'); setResetLoading(false); return }

      const newHash = await hashPassword(newPassword)
      await supabase.from('members').update({
        password_hash: newHash,
        reset_token: null,
        reset_token_expires_at: null,
      }).eq('id', resetMemberId)

      setResetStep(3)
    } catch (err) {
      setResetError('Bir hata oluştu: ' + err.message)
    } finally {
      setResetLoading(false)
    }
  }

  // Şifre sıfırlama ekranları
  if (resetStep > 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <FaKey className="text-gold-500 text-5xl mx-auto mb-3" />
            <h1 className="text-2xl font-extrabold text-primary-900">Şifre Sıfırla</h1>
            <p className="text-slate-500 text-sm mt-1">
              {resetStep === 1 && 'Telefon numaranızı girin'}
              {resetStep === 2 && 'Doğrulama kodunuzu ve yeni şifrenizi girin'}
              {resetStep === 3 && 'Şifreniz başarıyla güncellendi'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

            {/* Adım 1 — Telefon */}
            {resetStep === 1 && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numarası</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input required type="tel" value={resetPhone} onChange={e => setResetPhone(e.target.value)}
                      placeholder="05XX XXX XX XX veya +90..."
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Kayıt olduğunuz telefon numarasını girin.</p>
                </div>
                {resetError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{resetError}</p>}
                <button type="submit" disabled={resetLoading}
                  className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  {resetLoading ? 'Kontrol ediliyor...' : 'Doğrulama Kodu Oluştur'}
                </button>
                <button type="button" onClick={() => setResetStep(0)}
                  className="w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium">
                  <FaArrowLeft size={11} /> Giriş ekranına dön
                </button>
              </form>
            )}

            {/* Adım 2 — Kod + Yeni Şifre */}
            {resetStep === 2 && (
              <form onSubmit={handleResetConfirm} className="space-y-4">
                {/* Kod göster */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-700 font-semibold mb-2">Doğrulama Kodunuz</p>
                  <p className="text-3xl font-extrabold tracking-[0.3em] text-amber-800">{resetCode}</p>
                  <p className="text-xs text-amber-600 mt-2">Bu kodu not alın. 30 dakika geçerlidir.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doğrulama Kodu</label>
                  <input required value={enteredCode} onChange={e => setEnteredCode(e.target.value)}
                    placeholder="6 haneli kodu girin" maxLength={6}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-widest text-center font-bold text-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Yeni Şifre</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input required type={showNewPw ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} placeholder="En az 6 karakter" minLength={6}
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <button type="button" onClick={() => setShowNewPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Yeni Şifre Tekrar</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input required type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} placeholder="Şifrenizi tekrar girin"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>

                {resetError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{resetError}</p>}

                <button type="submit" disabled={resetLoading}
                  className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  {resetLoading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                </button>
                <button type="button" onClick={() => { setResetStep(1); setResetCode(''); setEnteredCode('') }}
                  className="w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium">
                  <FaArrowLeft size={11} /> Geri dön
                </button>
              </form>
            )}

            {/* Adım 3 — Başarı */}
            {resetStep === 3 && (
              <div className="text-center space-y-4">
                <FaCheckCircle className="text-green-500 text-5xl mx-auto" />
                <p className="text-slate-600 text-sm">Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.</p>
                <button onClick={() => { setResetStep(0); setResetPhone(''); setNewPassword(''); setConfirmPassword('') }}
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  Giriş Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Normal giriş ekranı
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-primary-900">Üye Girişi</h1>
          <p className="text-slate-500 text-sm mt-1">Telefon ve şifrenizle giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numarası</label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">Şifre</label>
              <button type="button" onClick={() => { setResetStep(1); setResetPhone(phone) }}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold transition-colors">
                Şifremi unuttum
              </button>
            </div>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input required type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Şifreniz"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            <FaSignInAlt size={14} />
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Henüz üye değil misiniz?{' '}
            <Link to="/uye-ol" className="text-primary-600 hover:text-primary-800 font-semibold">Başvurun</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

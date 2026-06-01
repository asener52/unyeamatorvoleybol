import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMember } from '../contexts/MemberAuthContext'
import { FaVolleyballBall, FaPhone, FaSignInAlt } from 'react-icons/fa'

export default function MemberLoginPage() {
  const { login, member } = useMember()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  if (member) {
    navigate('/profil', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(phone)
      navigate('/profil')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FaVolleyballBall className="text-gold-500 text-5xl mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-primary-900">Üye Girişi</h1>
          <p className="text-slate-500 text-sm mt-1">Telefon numaranızla giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numarası</label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                required type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            <FaSignInAlt size={14} />
            {loading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
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

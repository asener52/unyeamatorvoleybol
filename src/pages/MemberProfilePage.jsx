import { useNavigate, Link } from 'react-router-dom'
import { useMember } from '../contexts/MemberAuthContext'
import { FaVolleyballBall, FaPhone, FaEnvelope, FaSignOutAlt, FaComments, FaUser } from 'react-icons/fa'

const POS_COLOR = {
  'Pasör': 'bg-blue-100 text-blue-700',
  'Libero': 'bg-purple-100 text-purple-700',
  'Fil': 'bg-red-100 text-red-700',
  'Dış Vurucu': 'bg-green-100 text-green-700',
  'Orta Oyuncu': 'bg-orange-100 text-orange-700',
  'Seyirci': 'bg-slate-100 text-slate-600',
}

export default function MemberProfilePage() {
  const { member, logout } = useMember()
  const navigate = useNavigate()

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

  function handleLogout() {
    logout()
    navigate('/')
  }

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const posColor = POS_COLOR[member.position] || 'bg-slate-100 text-slate-600'

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Avatar + isim */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl p-8 text-white text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-extrabold mx-auto mb-4">
          {initials}
        </div>
        <h1 className="text-2xl font-extrabold">{member.name}</h1>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${posColor}`}>
          {member.position || 'Üye'}
        </span>
      </div>

      {/* Bilgiler */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 mb-4">
        <div className="flex items-center gap-3 px-5 py-4">
          <FaPhone className="text-primary-500 shrink-0" size={15} />
          <div>
            <div className="text-xs text-slate-400">Telefon</div>
            <div className="font-semibold text-slate-800">{member.phone}</div>
          </div>
        </div>
        {member.email && (
          <div className="flex items-center gap-3 px-5 py-4">
            <FaEnvelope className="text-primary-500 shrink-0" size={15} />
            <div>
              <div className="text-xs text-slate-400">E-posta</div>
              <div className="font-semibold text-slate-800">{member.email}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-5 py-4">
          <FaVolleyballBall className="text-gold-500 shrink-0" size={15} />
          <div>
            <div className="text-xs text-slate-400">Üyelik Durumu</div>
            <div className="font-semibold text-green-600">Onaylı Üye</div>
          </div>
        </div>
      </div>

      {/* Hızlı eylemler */}
      <div className="grid grid-cols-2 gap-3 mb-4">
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
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FaBars, FaTimes, FaVolleyballBall, FaUser, FaComments, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'
import { useMember } from '../contexts/MemberAuthContext'
import { useUnreadMessages } from '../hooks/useUnreadMessages'

const navLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/haberler', label: 'Haberler' },
  { to: '/etkinlikler', label: 'Etkinlikler' },
  { to: '/turnuvalar', label: 'Turnuvalar' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/anketler', label: 'Anketler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/mac-kayit', label: 'Maça Katıl', highlight: true },
]

function MemberDropdown({ member, onLogout, unread }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-semibold">
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-gold-500 text-primary-900 flex items-center justify-center text-xs font-extrabold overflow-hidden">
            {member.avatar_url
              ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
              : initials}
          </div>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">{member.name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="font-semibold text-slate-800 text-sm truncate">{member.name}</div>
            <div className="text-xs text-slate-400">{member.position || 'Üye'}</div>
          </div>
          <Link to="/profil" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <FaUser size={13} className="text-slate-400" /> Profilim
          </Link>
          <Link to="/mesajlar" onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="flex items-center gap-2.5">
              <FaComments size={13} className="text-slate-400" /> Mesajlar
            </span>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <button onClick={() => { onLogout(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <FaSignOutAlt size={13} /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { settings } = useSettings()
  const { member, logout } = useMember()
  const navigate = useNavigate()
  const brand = settings?.brand || {}
  const { total: unread } = useUnreadMessages(member?.id)

  const siteName = brand.name || 'Ünye Amatör Voleybol Topluluğu'
  const shortName = brand.shortName || 'ÜAV'

  function handleLogout() { logout(); navigate('/') }

  return (
    <nav className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <FaVolleyballBall className="text-gold-400 text-2xl animate-spin" style={{ animationDuration: '8s' }} />
            <span className="hidden sm:block leading-tight">
              <span className="text-gold-400">{siteName.split(' ')[0]}</span>{' '}
              <span className="text-sm font-normal text-blue-200">{siteName.split(' ').slice(1).join(' ')}</span>
            </span>
            <span className="sm:hidden text-gold-400">{shortName}</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(({ to, label, highlight }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  highlight
                    ? `px-3 py-2 rounded-md text-sm font-bold transition-colors ${isActive ? 'bg-gold-600 text-primary-900' : 'bg-gold-500 text-primary-900 hover:bg-gold-400'}`
                    : `px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gold-500 text-primary-900' : 'text-blue-100 hover:bg-primary-700 hover:text-white'}`
                }>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Sağ: üye girişi + mobil menü */}
          <div className="flex items-center gap-2 shrink-0">
            {member ? (
              <MemberDropdown member={member} onLogout={handleLogout} unread={unread} />
            ) : (
              <Link to="/uye-giris"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                <FaSignInAlt size={13} />
                <span className="hidden sm:inline">Üye Girişi</span>
              </Link>
            )}
            <button className="lg:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-primary-700"
              onClick={() => setOpen(!open)}>
              {open ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-primary-900 pb-3 px-4 space-y-1">
          {navLinks.map(({ to, label, highlight }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                highlight
                  ? `block px-3 py-2 rounded-md text-sm font-bold ${isActive ? 'bg-gold-600 text-primary-900' : 'bg-gold-500 text-primary-900'}`
                  : `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gold-500 text-primary-900' : 'text-blue-100 hover:bg-primary-700 hover:text-white'}`
              }>
              {label}
            </NavLink>
          ))}
          {member ? (
            <>
              <Link to="/profil" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-blue-100 hover:bg-primary-700 rounded-md">
                <FaUser size={12} /> Profilim ({member.name.split(' ')[0]})
              </Link>
              <Link to="/mesajlar" onClick={() => setOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-blue-100 hover:bg-primary-700 rounded-md">
                <span className="flex items-center gap-2"><FaComments size={12} /> Mesajlar</span>
                {unread > 0 && <span className="bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-300 hover:bg-primary-700 rounded-md">
                <FaSignOutAlt size={12} /> Çıkış Yap
              </button>
            </>
          ) : (
            <Link to="/uye-giris" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-blue-100 hover:bg-primary-700 rounded-md">
              <FaSignInAlt size={12} /> Üye Girişi
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

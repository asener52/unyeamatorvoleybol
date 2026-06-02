import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  FaVolleyballBall, FaNewspaper, FaImages, FaCalendarAlt, FaPoll,
  FaChartBar, FaSignOutAlt, FaBars, FaTimes, FaHome, FaPhotoVideo,
  FaCog, FaClipboardList, FaUsers, FaTrophy, FaComments, FaUserShield, FaBell
} from 'react-icons/fa'

const menuItems = [
  { to: '/admin', icon: FaChartBar, label: 'Gösterge Paneli', end: true },
  { to: '/admin/haberler', icon: FaNewspaper, label: 'Haberler' },
  { to: '/admin/slider', icon: FaPhotoVideo, label: 'Slider' },
  { to: '/admin/galeri', icon: FaImages, label: 'Galeri' },
  { to: '/admin/etkinlikler', icon: FaCalendarAlt, label: 'Etkinlikler' },
  { to: '/admin/turnuvalar', icon: FaTrophy, label: 'Turnuvalar' },
  { to: '/admin/anketler', icon: FaPoll, label: 'Anketler' },
  { to: '/admin/uyeler', icon: FaUsers, label: 'Üye Yönetimi' },
  { to: '/admin/mac-talepleri', icon: FaClipboardList, label: 'Maç Talepleri' },
  { to: '/admin/mesajlar', icon: FaComments, label: 'Mesajlar' },
  { to: '/admin/yoneticiler', icon: FaUserShield, label: 'Yöneticiler' },
  { to: '/admin/popup', icon: FaBell, label: 'Popup Yönetimi' },
  { to: '/admin/ayarlar', icon: FaCog, label: 'Site Ayarları' },
]

export default function AdminLayout({ children }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/admin/giris')
  }

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transition-transform duration-300
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:z-auto
    `}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <FaVolleyballBall className="text-gold-400 text-2xl" />
        <div>
          <div className="text-white font-bold text-sm leading-tight">Ünye Voleybol</div>
          <div className="text-slate-400 text-xs">Yönetici Paneli</div>
        </div>
        <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <FaTimes />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-slate-400 text-xs mb-3 truncate">{user?.email}</div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <FaHome size={12} /> Siteye Git
          </a>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-300 hover:text-white text-xs transition-colors"
          >
            <FaSignOutAlt size={12} /> Çıkış
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars size={20} />
          </button>
          <div className="text-sm text-slate-500 hidden sm:block">
            Hoşgeldiniz, <span className="font-semibold text-slate-700">{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

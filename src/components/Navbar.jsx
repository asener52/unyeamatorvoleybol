import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FaBars, FaTimes, FaVolleyballBall } from 'react-icons/fa'
import { useSettings } from '../hooks/useSettings'

const navLinks = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/haberler', label: 'Haberler' },
  { to: '/etkinlikler', label: 'Etkinlikler' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/anketler', label: 'Anketler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { settings } = useSettings()
  const brand = settings?.brand || {}

  const siteName = brand.name || 'Ünye Amatör Voleybolcular'
  const shortName = brand.shortName || 'ÜAV'

  return (
    <nav className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <FaVolleyballBall className="text-gold-400 text-2xl animate-spin" style={{ animationDuration: '8s' }} />
            <span className="hidden sm:block leading-tight">
              <span className="text-gold-400">{siteName.split(' ')[0]}</span>{' '}
              <span className="text-sm font-normal text-blue-200">{siteName.split(' ').slice(1).join(' ')}</span>
            </span>
            <span className="sm:hidden text-gold-400">{shortName}</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-gold-500 text-primary-900'
                      : 'text-blue-100 hover:bg-primary-700 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-primary-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-primary-900 pb-3 px-4 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-500 text-primary-900'
                    : 'text-blue-100 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}

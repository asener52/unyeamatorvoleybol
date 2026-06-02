import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { MemberAuthProvider } from './contexts/MemberAuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'

import Home from './pages/Home'
import NewsPage from './pages/NewsPage'
import EventsPage from './pages/EventsPage'
import GalleryPage from './pages/GalleryPage'
import PollsPage from './pages/PollsPage'
import AboutPage from './pages/AboutPage'
import MemberLoginPage from './pages/MemberLoginPage'
import MemberProfilePage from './pages/MemberProfilePage'
import ChatPage from './pages/ChatPage'

import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageNews from './pages/admin/ManageNews'
import ManageSlider from './pages/admin/ManageSlider'
import ManageGallery from './pages/admin/ManageGallery'
import ManageEvents from './pages/admin/ManageEvents'
import ManagePolls from './pages/admin/ManagePolls'
import ManageSettings from './pages/admin/ManageSettings'
import ManageMatchRequests from './pages/admin/ManageMatchRequests'
import ManageMembers from './pages/admin/ManageMembers'
import ManageTournaments from './pages/admin/ManageTournaments'
import ManageMessages from './pages/admin/ManageMessages'
import ManageAdmins from './pages/admin/ManageAdmins'
import ManagePopup from './pages/admin/ManagePopup'
import MatchRequestPage from './pages/MatchRequestPage'
import MembershipPage from './pages/MembershipPage'
import TournamentPage from './pages/TournamentPage'

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function AdminPages() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="haberler" element={<ManageNews />} />
          <Route path="slider" element={<ManageSlider />} />
          <Route path="galeri" element={<ManageGallery />} />
          <Route path="etkinlikler" element={<ManageEvents />} />
          <Route path="anketler" element={<ManagePolls />} />
          <Route path="ayarlar" element={<ManageSettings />} />
          <Route path="mac-talepleri" element={<ManageMatchRequests />} />
          <Route path="uyeler" element={<ManageMembers />} />
          <Route path="turnuvalar" element={<ManageTournaments />} />
          <Route path="mesajlar" element={<ManageMessages />} />
          <Route path="yoneticiler" element={<ManageAdmins />} />
          <Route path="popup" element={<ManagePopup />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <MemberAuthProvider>
            <Routes>
              <Route path="/admin/giris" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminPages />} />

              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/haberler" element={<PublicLayout><NewsPage /></PublicLayout>} />
              <Route path="/haberler/:id" element={<PublicLayout><NewsPage /></PublicLayout>} />
              <Route path="/etkinlikler" element={<PublicLayout><EventsPage /></PublicLayout>} />
              <Route path="/galeri" element={<PublicLayout><GalleryPage /></PublicLayout>} />
              <Route path="/anketler" element={<PublicLayout><PollsPage /></PublicLayout>} />
              <Route path="/hakkimizda" element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/mac-kayit" element={<PublicLayout><MatchRequestPage /></PublicLayout>} />
              <Route path="/uye-ol" element={<PublicLayout><MembershipPage /></PublicLayout>} />
              <Route path="/uye-giris" element={<PublicLayout><MemberLoginPage /></PublicLayout>} />
              <Route path="/profil" element={<PublicLayout><MemberProfilePage /></PublicLayout>} />
              <Route path="/mesajlar" element={<PublicLayout><ChatPage /></PublicLayout>} />
              <Route path="/turnuvalar" element={<PublicLayout><TournamentPage /></PublicLayout>} />
              <Route path="/turnuvalar/:id" element={<PublicLayout><TournamentPage /></PublicLayout>} />
            </Routes>
          </MemberAuthProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

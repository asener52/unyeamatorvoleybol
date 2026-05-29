import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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

import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageNews from './pages/admin/ManageNews'
import ManageSlider from './pages/admin/ManageSlider'
import ManageGallery from './pages/admin/ManageGallery'
import ManageEvents from './pages/admin/ManageEvents'
import ManagePolls from './pages/admin/ManagePolls'
import ManageSettings from './pages/admin/ManageSettings'

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
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin routes */}
          <Route path="/admin/giris" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminPages />} />

          {/* Public routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/haberler" element={<PublicLayout><NewsPage /></PublicLayout>} />
          <Route path="/haberler/:id" element={<PublicLayout><NewsPage /></PublicLayout>} />
          <Route path="/etkinlikler" element={<PublicLayout><EventsPage /></PublicLayout>} />
          <Route path="/galeri" element={<PublicLayout><GalleryPage /></PublicLayout>} />
          <Route path="/anketler" element={<PublicLayout><PollsPage /></PublicLayout>} />
          <Route path="/hakkimizda" element={<PublicLayout><AboutPage /></PublicLayout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

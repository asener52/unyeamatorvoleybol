import { useCollection, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import { FaTrash, FaCheck, FaTimes, FaPhone, FaEnvelope, FaUser } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatDate(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}

const STATUS = {
  bekliyor:  { label: 'Bekliyor',  cls: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Onaylandı', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
}

export default function ManageMembers() {
  const { docs, loading } = useCollection('members', 'created_at', 200)

  const counts = {
    bekliyor: docs.filter(d => d.status === 'bekliyor').length,
    approved: docs.filter(d => d.status === 'approved').length,
  }

  async function setStatus(id, status) {
    await updateDocument('members', id, { status })
  }

  async function handleDelete(id) {
    if (!confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) return
    await deleteDocument('members', id)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Üye Başvuruları</h1>
        <p className="text-slate-500 text-sm mt-0.5">{docs.length} başvuru</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-yellow-600">{counts.bekliyor}</div>
          <div className="text-xs text-slate-500 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600">{counts.approved}</div>
          <div className="text-xs text-slate-500 mt-0.5">Onaylandı</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Henüz başvuru yok.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Ad Soyad</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">İletişim</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Pozisyon</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(d => {
                const st = STATUS[d.status] || STATUS.bekliyor
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaUser size={12} className="text-slate-300" />
                        <span className="font-medium text-slate-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        <a href={`tel:${d.phone}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs">
                          <FaPhone size={10} /> {d.phone}
                        </a>
                        {d.email && (
                          <a href={`mailto:${d.email}`} className="flex items-center gap-1 text-slate-500 hover:text-primary-600 text-xs">
                            <FaEnvelope size={10} /> {d.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{d.position}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.status !== 'approved' && (
                          <button onClick={() => setStatus(d.id, 'approved')} title="Onayla"
                            className="text-green-500 hover:text-green-700 p-1.5 hover:bg-green-50 rounded-lg transition-colors">
                            <FaCheck size={13} />
                          </button>
                        )}
                        {d.status !== 'rejected' && (
                          <button onClick={() => setStatus(d.id, 'rejected')} title="Reddet"
                            className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <FaTimes size={13} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(d.id)}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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

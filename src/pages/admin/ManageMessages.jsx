import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FaTrash, FaComments, FaUser, FaUsers } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatTime(ts) {
  if (!ts) return ''
  try { return format(new Date(ts), 'd MMM yyyy HH:mm', { locale: tr }) } catch { return '' }
}

export default function ManageMessages() {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | group | dm

  useEffect(() => {
    supabase.from('members').select('id,name')
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(m => { map[m.id] = m.name })
        setMembers(map)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(300)
    if (filter === 'group') q = q.is('receiver_id', null)
    if (filter === 'dm') q = q.not('receiver_id', 'is', null)
    q.then(({ data }) => { setMessages(data || []); setLoading(false) })
  }, [filter])

  async function handleDelete(id) {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (!error) setMessages(prev => prev.filter(m => m.id !== id))
  }

  const groupCount = messages.filter(m => !m.receiver_id).length
  const dmCount = messages.filter(m => m.receiver_id).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Mesajlar</h1>
        <p className="text-slate-500 text-sm mt-0.5">{messages.length} mesaj</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-primary-700">{groupCount}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><FaUsers size={10} /> Grup Mesajı</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-extrabold text-slate-700">{dmCount}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><FaUser size={10} /> Direkt Mesaj</div>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-4">
        {[['all', 'Tümü'], ['group', 'Grup'], ['dm', 'Direkt']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === val ? 'bg-primary-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Mesaj bulunamadı.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Gönderen</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Tür</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mesaj</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Tarih</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map(msg => {
                const isGroup = !msg.receiver_id
                const receiverName = msg.receiver_id ? members[msg.receiver_id] : null
                return (
                  <tr key={msg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{msg.sender_name}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {isGroup ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                          <FaUsers size={9} /> Grup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          <FaUser size={9} /> → {receiverName || '?'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-700 truncate">{msg.content}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell whitespace-nowrap">
                      {formatTime(msg.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(msg.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <FaTrash size={13} />
                      </button>
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

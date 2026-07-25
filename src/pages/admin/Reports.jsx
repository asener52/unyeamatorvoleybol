import { useMemo, useState } from 'react'
import { useCollection } from '../../hooks/useFirestore'
import { supabase } from '../../lib/supabase'
import { FaChartBar, FaShareAlt, FaStar, FaShieldAlt, FaClock } from 'react-icons/fa'

export default function Reports() {
  const { docs: requests, loading } = useCollection('match_requests', 'created_at', 1000)
  const { docs: members } = useCollection('members', 'name', 500)
  const [updating, setUpdating] = useState(null)
  const [shareOverrides, setShareOverrides] = useState({})
  const isShared = member => shareOverrides[member.id] ?? member.stats_published ?? false

  const rows = useMemo(() => members.map(member => {
    const memberRequests = requests.filter(request => request.member_id === member.id)
    const asKadro = memberRequests.filter(request => request.status === 'as_kadro').length
    const reserve = memberRequests.filter(request => request.status === 'yedek_kadro').length
    const waiting = memberRequests.filter(request => request.status === 'bekliyor').length
    const rejected = memberRequests.filter(request => request.status === 'reddedildi').length
    const eligible = asKadro + reserve + waiting + rejected
    return {
      ...member,
      total: memberRequests.length,
      asKadro,
      reserve,
      waiting,
      rate: eligible ? Math.round(((asKadro + reserve) / eligible) * 100) : 0,
    }
  }).sort((a, b) => b.total - a.total), [members, requests])

  async function toggleShare(member) {
    const nextValue = !isShared(member)
    setUpdating(member.id)
    const { error } = await supabase.from('members')
      .update({ stats_published: nextValue })
      .eq('id', member.id)
    setUpdating(null)
    if (error) alert('Paylaşım ayarı güncellenemedi: ' + error.message)
    else setShareOverrides(current => ({ ...current, [member.id]: nextValue }))
  }

  const totals = {
    members: rows.length,
    requests: requests.length,
    shared: members.filter(member => isShared(member)).length,
    rate: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.rate, 0) / rows.length) : 0,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><FaChartBar /> Raporlar</h1>
        <p className="text-sm text-slate-500">Üye performansları ve halka açık paylaşım ayarları</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ['Toplam Üye', totals.members, 'text-primary-700'],
          ['Toplam Başvuru', totals.requests, 'text-slate-700'],
          ['Paylaşılan Üye', totals.shared, 'text-green-600'],
          ['Ortalama Performans', `%${totals.rate}`, 'text-purple-600'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
      {loading ? <div className="h-52 bg-slate-200 animate-pulse rounded-2xl" /> : (
        <div className="space-y-3">
          {rows.map(member => (
            <article key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex-1 min-w-48">
                  <h2 className="font-bold text-slate-800">{member.name}</h2>
                  <div className="text-xs text-slate-400">{member.total} maç başvurusu</div>
                </div>
                <button onClick={() => toggleShare(member)} disabled={updating === member.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                    isShared(member)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  <FaShareAlt /> {isShared(member) ? 'Paylaşılıyor' : 'Paylaş'}
                </button>
              </div>
              <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Performans</span><span>%{member.rate}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full transition-all"
                      style={{ width: `${member.rate}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg"><FaStar /> {member.asKadro} As</span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg"><FaShieldAlt /> {member.reserve} Yedek</span>
                  <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1.5 rounded-lg"><FaClock /> {member.waiting} Bekliyor</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

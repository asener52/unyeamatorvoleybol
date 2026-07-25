import { useMemo, useState } from 'react'
import { useCollection } from '../../hooks/useFirestore'
import { saveSettings, useSettings } from '../../hooks/useSettings'
import { FaChartBar, FaShareAlt, FaStar, FaShieldAlt, FaClock, FaEyeSlash } from 'react-icons/fa'

export default function Reports() {
  const { docs: requests, loading } = useCollection('match_requests', 'created_at', 1000)
  const { docs: members } = useCollection('members', 'name', 500)
  const { settings, updateSettings } = useSettings()
  const [savingShare, setSavingShare] = useState(false)
  const [shareOverride, setShareOverride] = useState(null)
  const isShared = shareOverride ?? settings?.publicMemberStatsEnabled ?? false

  const rows = useMemo(() => members.map(member => {
    const memberRequests = requests.filter(request => request.member_id === member.id)
    const asKadro = memberRequests.filter(request => request.status === 'as_kadro').length
    const reserve = memberRequests.filter(request => request.status === 'yedek_kadro').length
    const waiting = memberRequests.filter(request => request.status === 'bekliyor').length
    const rejected = memberRequests.filter(request => request.status === 'reddedildi').length
    const eligible = asKadro + reserve + waiting + rejected
    return {
      id: member.id,
      name: member.name,
      total: memberRequests.length,
      asKadro,
      reserve,
      waiting,
      rate: eligible ? Math.round(((asKadro + reserve) / eligible) * 100) : 0,
    }
  }).sort((a, b) =>
    b.rate - a.rate ||
    (b.asKadro + b.reserve) - (a.asKadro + a.reserve)
  ), [members, requests])

  async function toggleTableShare() {
    const nextValue = !isShared
    setSavingShare(true)
    try {
      const nextSettings = { ...(settings || {}), publicMemberStatsEnabled: nextValue }
      await saveSettings(nextSettings)
      updateSettings(nextSettings)
      setShareOverride(nextValue)
    } catch (error) {
      alert('Tablo paylaşım ayarı güncellenemedi: ' + error.message)
    } finally {
      setSavingShare(false)
    }
  }

  const averageRate = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.rate, 0) / rows.length)
    : 0

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><FaChartBar /> Raporlar</h1>
          <p className="text-sm text-slate-500">Üye performans tablosu ve public paylaşım ayarı</p>
        </div>
        <button onClick={toggleTableShare} disabled={savingShare}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50 ${
            isShared ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'
          }`}>
          {isShared ? <FaEyeSlash /> : <FaShareAlt />}
          {savingShare ? 'Kaydediliyor…' : isShared ? 'Tabloyu Yayından Kaldır' : 'Tabloyu Public Alanda Paylaş'}
        </button>
      </div>

      <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
        isShared ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        {isShared
          ? 'Üye istatistikleri tablosu public arayüzde yayınlanıyor.'
          : 'Üye istatistikleri yalnızca yönetici panelinde görülebilir.'}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ['Toplam Üye', rows.length, 'text-primary-700'],
          ['Toplam Başvuru', requests.length, 'text-slate-700'],
          ['As Kadro', rows.reduce((sum, row) => sum + row.asKadro, 0), 'text-green-600'],
          ['Ortalama Performans', `%${averageRate}`, 'text-purple-600'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" /> : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">#</th>
                  <th className="text-left px-5 py-4 font-semibold">Ad Soyad</th>
                  <th className="text-center px-4 py-4 font-semibold">Başvuru</th>
                  <th className="text-center px-4 py-4 font-semibold">As Kadro</th>
                  <th className="text-center px-4 py-4 font-semibold">Yedek</th>
                  <th className="text-center px-4 py-4 font-semibold">Bekliyor</th>
                  <th className="text-left px-5 py-4 font-semibold min-w-56">Performans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((member, index) => (
                  <tr key={member.id} className="hover:bg-primary-50/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{member.name}</div>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-600">{member.total}</td>
                    <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold"><FaStar /> {member.asKadro}</span></td>
                    <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold"><FaShieldAlt /> {member.reserve}</span></td>
                    <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-bold"><FaClock /> {member.waiting}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5"><span>Katılım</span><span>%{member.rate}</span></div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-green-500 rounded-full"
                          style={{ width: `${member.rate}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

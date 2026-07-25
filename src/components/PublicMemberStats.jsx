import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../hooks/useSettings'
import { FaChartLine, FaShieldAlt, FaStar } from 'react-icons/fa'

export default function PublicMemberStats() {
  const { settings } = useSettings()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const enabled = settings?.publicMemberStatsEnabled === true

  useEffect(() => {
    if (!enabled) return
    supabase.from('public_member_stats').select('*').order('attendance_rate', { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false) })
  }, [enabled])

  if (!enabled) return null

  return (
    <section className="mb-14">
      <div className="text-center mb-7">
        <div className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-1">Performans</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Üye İstatistikleri</h2>
        <p className="text-sm text-slate-500 mt-2">Üyelerimizin maç katılım performansları</p>
      </div>
      {loading ? (
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-900 text-white">
                <tr>
                  <th className="text-left px-5 py-4">#</th>
                  <th className="text-left px-5 py-4">Ad Soyad</th>
                  <th className="text-center px-4 py-4">Başvuru</th>
                  <th className="text-center px-4 py-4">As Kadro</th>
                  <th className="text-center px-4 py-4">Yedek</th>
                  <th className="text-left px-5 py-4 min-w-52">Performans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member, index) => (
                  <tr key={member.id} className="hover:bg-primary-50/50">
                    <td className="px-5 py-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{member.name}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-600">{member.total}</td>
                    <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1 text-green-700 font-bold"><FaStar /> {member.as_kadro}</span></td>
                    <td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1 text-blue-700 font-bold"><FaShieldAlt /> {member.yedek_kadro}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span className="flex items-center gap-1"><FaChartLine /> Katılım</span><span>%{member.attendance_rate}</span></div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full"
                          style={{ width: `${member.attendance_rate}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!members.length && (
                  <tr><td colSpan={6} className="text-center px-5 py-12 text-slate-400">Henüz istatistik bulunmuyor.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

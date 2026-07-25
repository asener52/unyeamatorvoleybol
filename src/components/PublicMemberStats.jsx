import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaChartLine, FaShieldAlt, FaStar } from 'react-icons/fa'

export default function PublicMemberStats() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('public_member_stats').select('*').order('attendance_rate', { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false) })
  }, [])

  if (!loading && !members.length) return null

  return (
    <section className="mb-14">
      <div className="text-center mb-7">
        <div className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-1">Performans</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Üye İstatistikleri</h2>
        <p className="text-sm text-slate-500 mt-2">Topluluğumuzun paylaşıma açık performans değerleri</p>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(item => <div key={item} className="h-36 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <article key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-extrabold">
                  {member.name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
                  <div className="text-xs text-slate-400">{member.total} başvuru</div>
                </div>
                <FaChartLine className="ml-auto text-primary-400" />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Performans</span><span className="text-primary-700">%{member.attendance_rate}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full"
                  style={{ width: `${member.attendance_rate}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5">
                  <FaStar /> {member.as_kadro} As Kadro
                </div>
                <div className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5">
                  <FaShieldAlt /> {member.yedek_kadro} Yedek
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FaPoll, FaCheckCircle, FaLock, FaUser } from 'react-icons/fa'

function MemberVerify({ onVerified }) {
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function handleCheck(e) {
    e.preventDefault()
    setChecking(true); setError('')
    const { data } = await supabase.from('members').select('id,name').eq('phone', phone.trim()).eq('status', 'approved').single()
    setChecking(false)
    if (data) { sessionStorage.setItem('member_verified', JSON.stringify(data)); onVerified(data) }
    else setError('Bu telefon numarasıyla onaylı üye bulunamadı.')
  }

  return (
    <div className="text-center py-4 space-y-3">
      <FaLock className="text-primary-400 text-3xl mx-auto" />
      <p className="text-slate-600 text-sm font-medium">Bu ankete katılmak için üye olmanız gerekiyor.</p>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon numaranız"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button type="submit" disabled={checking || !phone}
          className="bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          {checking ? '...' : 'Doğrula'}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}

export default function PollCard({ poll }) {
  const [voted, setVoted] = useState(() => localStorage.getItem(`poll_${poll.id}`) || null)
  const [localVotes, setLocalVotes] = useState(poll.votes || {})
  const [member, setMember] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('member_verified')) } catch { return null }
  })

  const isMembers = poll.visibility === 'members'
  const totalVotes = Object.values(localVotes).reduce((a, b) => a + b, 0)

  async function handleVote(optionId) {
    if (voted) return
    try {
      const newVotes = { ...localVotes, [optionId]: (localVotes[optionId] || 0) + 1 }
      const { error } = await supabase.from('polls').update({ votes: newVotes }).eq('id', poll.id)
      if (error) throw error
      setLocalVotes(newVotes)
      setVoted(optionId)
      localStorage.setItem(`poll_${poll.id}`, optionId)
    } catch { }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
      <div className="flex items-start gap-3 mb-4">
        <FaPoll className="text-primary-600 text-2xl shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg leading-snug">{poll.question}</h3>
          <div className="flex items-center gap-2 mt-1">
            {totalVotes > 0 && <p className="text-slate-400 text-sm">{totalVotes} oy</p>}
            {isMembers && (
              <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
                <FaLock size={9} /> Üyelere Özel
              </span>
            )}
          </div>
        </div>
      </div>

      {isMembers && !member ? (
        <MemberVerify onVerified={setMember} />
      ) : (
        <>
          {isMembers && member && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 mb-3">
              <FaUser size={10} /> <span>Hoşgeldiniz, {member.name}</span>
            </div>
          )}
          <div className="space-y-3">
            {poll.options?.map((opt) => {
              const count = localVotes[opt.id] || 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isVoted = voted === opt.id
              return (
                <div key={opt.id}>
                  {voted ? (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium flex items-center gap-1 ${isVoted ? 'text-primary-600' : 'text-slate-700'}`}>
                          {isVoted && <FaCheckCircle size={13} />}{opt.label}
                        </span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${isVoted ? 'bg-primary-500' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => handleVote(opt.id)}
                      className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50 text-slate-700 text-sm font-medium transition-all">
                      {opt.label}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

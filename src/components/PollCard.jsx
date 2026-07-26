import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMember } from '../contexts/MemberAuthContext'
import { FaPoll, FaCheckCircle, FaLock, FaSignInAlt } from 'react-icons/fa'

export default function PollCard({ poll }) {
  const [voted, setVoted] = useState(() => localStorage.getItem(`poll_${poll.id}`) || null)
  const [localVotes, setLocalVotes] = useState(poll.votes || {})
  const { member } = useMember()

  const isMembers = poll.visibility === 'members'
  const totalVotes = Object.values(localVotes).reduce((a, b) => a + b, 0)
  const canVote = !!member

  async function handleVote(optionId) {
    if (voted || !canVote) return
    try {
      const newVotes = { ...localVotes, [optionId]: (localVotes[optionId] || 0) + 1 }
      const { error } = await supabase.rpc('cast_poll_vote', {
        p_poll_id: poll.id,
        p_member_id: member.id,
        p_option_id: optionId,
      })
      if (error) throw error
      setLocalVotes(newVotes); setVoted(optionId)
      localStorage.setItem(`poll_${poll.id}`, optionId)
    } catch (error) {
      if (error.code === '23505' || /unique|duplicate/i.test(error.message || '')) {
        alert('Bu ankete daha önce oy verdiniz.')
      } else {
        alert('Oy kaydedilemedi: ' + error.message)
      }
    }
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

      {!member ? (
        <div className="text-center py-4 space-y-3">
          <FaLock className="text-primary-300 text-3xl mx-auto" />
          <p className="text-slate-600 text-sm">Oyunuzun güvenli şekilde kaydedilmesi için üye girişi yapın.</p>
          <Link to="/uye-giris"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            <FaSignInAlt size={13} /> Üye Girişi
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  )
}

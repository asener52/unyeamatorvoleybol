import { useState } from 'react'
import { doc, runTransaction, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'
import { FaPoll, FaCheckCircle } from 'react-icons/fa'

export default function PollCard({ poll }) {
  const [voted, setVoted] = useState(() => {
    const stored = localStorage.getItem(`poll_${poll.id}`)
    return stored || null
  })
  const [localVotes, setLocalVotes] = useState(poll.votes || {})

  const totalVotes = Object.values(localVotes).reduce((a, b) => a + b, 0)

  async function handleVote(optionId) {
    if (voted) return

    try {
      const pollRef = doc(db, 'polls', poll.id)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(pollRef)
        const current = snap.data().votes || {}
        current[optionId] = (current[optionId] || 0) + 1
        tx.update(pollRef, { votes: current })
      })

      const newVotes = { ...localVotes, [optionId]: (localVotes[optionId] || 0) + 1 }
      setLocalVotes(newVotes)
      setVoted(optionId)
      localStorage.setItem(`poll_${poll.id}`, optionId)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <FaPoll className="text-primary-600 text-2xl shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-snug">{poll.question}</h3>
          {totalVotes > 0 && (
            <p className="text-slate-400 text-sm mt-1">{totalVotes} oy</p>
          )}
        </div>
      </div>

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
                      {isVoted && <FaCheckCircle size={13} />}
                      {opt.label}
                    </span>
                    <span className="text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isVoted ? 'bg-primary-500' : 'bg-slate-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleVote(opt.id)}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50 text-slate-700 text-sm font-medium transition-all duration-200"
                >
                  {opt.label}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

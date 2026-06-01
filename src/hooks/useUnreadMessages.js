import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnreadMessages(memberId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!memberId) { setCount(0); return }
    const lastRead = localStorage.getItem(`msg_last_read_${memberId}`) || new Date(0).toISOString()

    supabase.from('messages')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', lastRead)
      .neq('sender_id', memberId)
      .then(({ count: c }) => setCount(c || 0))

    const ch = supabase
      .channel(`unread_${memberId}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.sender_id !== memberId) setCount(n => n + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [memberId])

  return count
}

export function markMessagesRead(memberId) {
  if (memberId) localStorage.setItem(`msg_last_read_${memberId}`, new Date().toISOString())
}

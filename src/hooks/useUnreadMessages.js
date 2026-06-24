import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getLastRead(memberId, convId) {
  return localStorage.getItem(`msg_read_${memberId}_${convId}`) || new Date(0).toISOString()
}

export function markConversationRead(memberId, convId) {
  if (memberId) localStorage.setItem(`msg_read_${memberId}_${convId}`, new Date().toISOString())
}

// Geriye dönük uyumluluk için
export function markMessagesRead(memberId) {
  markConversationRead(memberId, 'group')
}

export function useUnreadMessages(memberId) {
  const [state, setState] = useState({ total: 0, byConversation: {} })

  const refresh = useCallback(async () => {
    if (!memberId) { setState({ total: 0, byConversation: {} }); return }

    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, created_at')
      .neq('sender_id', memberId)
      .or(`receiver_id.eq.${memberId},receiver_id.is.null`)
      .limit(200) // kota tasarrufu: son 200 mesaja bak

    if (!data) return

    const byConv = {}
    for (const msg of data) {
      const convId = msg.receiver_id === null ? 'group' : msg.sender_id
      const lastRead = getLastRead(memberId, convId)
      if (msg.created_at > lastRead) {
        byConv[convId] = (byConv[convId] || 0) + 1
      }
    }

    const total = Object.values(byConv).reduce((a, b) => a + b, 0)
    setState({ total, byConversation: byConv })
  }, [memberId])

  useEffect(() => {
    refresh()
    const ch = supabase
      .channel(`unread_${memberId}_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [memberId, refresh])

  return state
}

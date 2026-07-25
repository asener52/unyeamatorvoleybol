import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/supabase'
import { useMember } from '../contexts/MemberAuthContext'
import { markConversationRead, useUnreadMessages } from '../hooks/useUnreadMessages'
import { FaPaperPlane, FaUsers, FaComments, FaSignInAlt, FaImage, FaDownload, FaTimes } from 'react-icons/fa'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const IMAGE_MESSAGE_PREFIX = '__IMAGE_MESSAGE__:'

function parseMessageContent(content) {
  if (!content?.startsWith(IMAGE_MESSAGE_PREFIX)) return { text: content || '' }
  try {
    return { image: JSON.parse(content.slice(IMAGE_MESSAGE_PREFIX.length)) }
  } catch {
    return { text: content }
  }
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return format(d, 'HH:mm')
    return format(d, 'd MMM HH:mm', { locale: tr })
  } catch { return '' }
}

function Avatar({ name, avatarUrl, size = 8 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden`}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  )
}

export default function ChatPage() {
  const { member } = useMember()
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activeDM, setActiveDM] = useState(null) // null = grup sohbeti
  const [showSidebar, setShowSidebar] = useState(false)
  const bottomRef = useRef(null)
  const imageInputRef = useRef(null)
  const { byConversation = {} } = useUnreadMessages(member?.id)

  // Onaylı üyeleri yükle
  useEffect(() => {
    supabase.from('members').select('id,name,position,avatar_url').eq('status', 'approved').order('name')
      .then(({ data }) => setMembers(data || []))
  }, [])

  // Mesajları yükle + realtime
  useEffect(() => {
    const receiverId = activeDM?.id ?? null

    async function loadMessages() {
      let q = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
      if (receiverId) {
        q = q.or(`and(sender_id.eq.${member?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${member?.id})`)
      } else {
        q = q.is('receiver_id', null)
      }
      const { data } = await q
      setMessages(data || [])
    }

    loadMessages()
    // Sayfaya/konuşmaya girilince hemen okundu say → badge temizlenir
    if (member?.id) markConversationRead(member.id, receiverId ?? 'group')

    const channelName = `messages_${receiverId ?? 'group'}_${Math.random().toString(36).slice(2)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        const isGroup = receiverId === null && msg.receiver_id === null
        const isDM = receiverId && (
          (msg.sender_id === member?.id && msg.receiver_id === receiverId) ||
          (msg.sender_id === receiverId && msg.receiver_id === member?.id)
        )
        if (isGroup || isDM) setMessages(prev => [...prev, msg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeDM, member?.id])

  // Yeni mesajda aşağı kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if ((!input.trim() && !imageFile) || !member) return
    setSending(true)
    let content = input.trim()
    if (imageFile) {
      try {
        const url = await uploadFile('gallery', `message_${member.id}_${imageFile.name}`, imageFile)
        content = IMAGE_MESSAGE_PREFIX + JSON.stringify({
          url, name: imageFile.name, caption: input.trim(),
        })
      } catch (error) {
        alert('Görsel yüklenemedi: ' + error.message)
        setSending(false)
        return
      }
    }
    const msg = {
      sender_id: member.id,
      sender_name: member.name,
      receiver_id: activeDM?.id ?? null,
      content,
    }
    const { error } = await supabase.from('messages').insert([msg])
    if (!error) {
      setInput('')
      setImageFile(null)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview('')
    }
    else alert('Mesaj gönderilemedi: ' + error.message)
    setSending(false)
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Lütfen bir görsel dosyası seçin.'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Görsel boyutu 10 MB’dan büyük olamaz.'); return }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
  }

  async function downloadImage(image) {
    try {
      const response = await fetch(image.url)
      if (!response.ok) throw new Error('Dosya alınamadı')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = image.name || 'mesaj-gorseli'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(image.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!member) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
        <div>
          <FaComments className="text-slate-300 text-5xl mx-auto mb-4" />
          <p className="text-slate-600 font-semibold mb-3">Mesajlaşmak için giriş yapmalısınız.</p>
          <Link to="/uye-giris"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
            <FaSignInAlt size={13} /> Üye Girişi
          </Link>
        </div>
      </div>
    )
  }

  const chatTitle = activeDM ? activeDM.name : 'Topluluk Sohbeti'
  const chatSub = activeDM ? `${activeDM.position || 'Üye'}` : `${members.length} üye`

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex h-full overflow-hidden">

        {/* Sidebar — üye listesi */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-72 border-r border-slate-100 shrink-0`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><FaUsers size={15} /> Üyeler</h2>
            <p className="text-xs text-slate-400 mt-0.5">{members.length} onaylı üye</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Grup sohbeti */}
            <button
              onClick={() => { setActiveDM(null); setShowSidebar(false); markConversationRead(member.id, 'group') }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${!activeDM ? 'bg-primary-50 border-r-2 border-primary-600' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <FaComments className="text-primary-600" size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm">Topluluk Sohbeti</div>
                <div className="text-xs text-slate-400">Tüm üyeler</div>
              </div>
              {byConversation['group'] > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                  {byConversation['group'] > 9 ? '9+' : byConversation['group']}
                </span>
              )}
            </button>

            <div className="px-4 py-2 text-xs text-slate-400 font-semibold uppercase tracking-wide">Direkt Mesaj</div>
            {members.filter(m => m.id !== member.id).map(m => (
              <button key={m.id}
                onClick={() => { setActiveDM(m); setShowSidebar(false); markConversationRead(member.id, m.id) }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${activeDM?.id === m.id ? 'bg-primary-50 border-r-2 border-primary-600' : ''}`}>
                <Avatar name={m.name} avatarUrl={m.avatar_url} size={9} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.position || 'Üye'}</div>
                </div>
                {byConversation[m.id] > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                    {byConversation[m.id] > 9 ? '9+' : byConversation[m.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sohbet alanı */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden text-slate-500 hover:text-slate-800 p-1">
              <FaUsers size={18} />
            </button>
            {activeDM ? <Avatar name={activeDM.name} avatarUrl={activeDM.avatar_url} size={9} /> : (
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <FaComments className="text-primary-600" size={15} />
              </div>
            )}
            <div>
              <div className="font-bold text-slate-800">{chatTitle}</div>
              <div className="text-xs text-slate-400">{chatSub}</div>
            </div>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-12">
                {activeDM ? `${activeDM.name} ile henüz mesaj yok.` : 'Topluluğa ilk mesajı siz atın!'}
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === member.id
              const parsedContent = parseMessageContent(msg.content)
              const prevMsg = messages[i - 1]
              const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && showSender && <Avatar name={msg.sender_name} avatarUrl={members.find(m => m.id === msg.sender_id)?.avatar_url} size={8} />}
                  {!isMe && !showSender && <div className="w-8 shrink-0" />}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && showSender && (
                      <span className="text-xs text-slate-500 font-semibold mb-1 ml-1">{msg.sender_name}</span>
                    )}
                    <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {parsedContent.image ? (
                        <div className="w-56 sm:w-72">
                          <a href={parsedContent.image.url} target="_blank" rel="noreferrer">
                            <img src={parsedContent.image.url} alt={parsedContent.image.name || 'Mesaj görseli'}
                              className="w-full max-h-72 object-cover bg-slate-200" />
                          </a>
                          <div className="px-3 py-2">
                            {parsedContent.image.caption && (
                              <p className="mb-2 break-words">{parsedContent.image.caption}</p>
                            )}
                            <button type="button" onClick={() => downloadImage(parsedContent.image)}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                                isMe ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white hover:bg-slate-200 text-primary-700'
                              }`}>
                              <FaDownload size={11} /> İndir
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-2.5 whitespace-pre-wrap break-words">{parsedContent.text}</div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 mx-1">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Mesaj gönder */}
          <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 shrink-0">
            {imagePreview && (
              <div className="relative inline-block mb-3">
                <img src={imagePreview} alt="Gönderilecek görsel" className="h-20 w-28 object-cover rounded-lg border border-slate-200" />
                <button type="button" onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow">
                  <FaTimes size={10} />
                </button>
                <div className="text-[10px] text-slate-500 mt-1 max-w-28 truncate">{imageFile?.name}</div>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={sending}
                title="Görsel ekle"
                className="border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-600 px-3 py-2.5 rounded-xl transition-colors shrink-0">
                <FaImage size={17} />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={imageFile ? 'Görsele açıklama ekleyin…' : activeDM ? `${activeDM.name}'e mesaj yaz...` : 'Topluluğa mesaj yaz...'}
                className="flex-1 min-w-0 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="off"
              />
              <button type="submit" disabled={sending || (!input.trim() && !imageFile)}
                className="bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold shrink-0">
                <FaPaperPlane size={13} />
                <span className="hidden sm:inline">{sending ? 'Gönderiliyor' : 'Gönder'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

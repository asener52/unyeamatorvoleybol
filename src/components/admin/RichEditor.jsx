import { useEffect, useRef } from 'react'
import {
  FaBold, FaItalic, FaUnderline, FaListUl, FaListOl,
  FaLink, FaUnlink, FaHeading, FaQuoteLeft, FaEraser,
} from 'react-icons/fa'

const TOOLBAR = [
  [
    { title: 'Kalın', icon: FaBold,       cmd: 'bold' },
    { title: 'İtalik', icon: FaItalic,    cmd: 'italic' },
    { title: 'Altı Çizili', icon: FaUnderline, cmd: 'underline' },
  ],
  [
    { title: 'Başlık (H2)', icon: FaHeading, cmd: 'formatBlock', val: 'h2' },
    { title: 'Alt Başlık (H3)', icon: FaHeading, cmd: 'formatBlock', val: 'h3', small: true },
    { title: 'Alıntı', icon: FaQuoteLeft, cmd: 'formatBlock', val: 'blockquote' },
  ],
  [
    { title: 'Madde Listesi', icon: FaListUl, cmd: 'insertUnorderedList' },
    { title: 'Numaralı Liste', icon: FaListOl, cmd: 'insertOrderedList' },
  ],
  [
    { title: 'Bağlantı Ekle', icon: FaLink,   cmd: 'link' },
    { title: 'Bağlantı Kaldır', icon: FaUnlink, cmd: 'unlink' },
    { title: 'Biçimi Temizle', icon: FaEraser, cmd: 'removeFormat' },
  ],
]

export default function RichEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const isInitialized = useRef(false)

  // İlk yüklemede veya value dışarıdan değiştiğinde içeriği set et
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (!isInitialized.current) {
      el.innerHTML = value || ''
      isInitialized.current = true
    }
  }, [])

  // value prop değiştiğinde (örn: yeni haber açılınca) sıfırla
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    // Sadece dışarıdan sıfırlanma durumunda (boş form ya da edit)
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || ''
    }
  }, [value])

  function exec(cmd, val) {
    if (cmd === 'link') {
      const url = prompt('URL girin:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'unlink') {
      document.execCommand('unlink', false, null)
    } else if (val) {
      document.execCommand(cmd, false, val)
    } else {
      document.execCommand(cmd, false, null)
    }
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  function handleInput() {
    onChange(editorRef.current?.innerHTML || '')
  }

  function handlePaste(e) {
    // Sadece düz metin yapıştır — HTML karmaşasını engeller
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-slate-50 border-b border-slate-200">
        {TOOLBAR.map((group, gi) => (
          <div key={gi} className="flex gap-0.5 mr-2 last:mr-0">
            {group.map(({ title, icon: Icon, cmd, val, small }) => (
              <button
                key={title}
                type="button"
                title={title}
                onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Icon size={small ? 11 : 13} />
              </button>
            ))}
            {gi < TOOLBAR.length - 1 && <div className="w-px bg-slate-200 mx-1 self-stretch" />}
          </div>
        ))}
      </div>

      {/* Editör alanı */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[180px] max-h-[400px] overflow-y-auto p-3 text-sm text-slate-800 focus:outline-none rich-content"
      />

      <style>{`
        .rich-content h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        .rich-content h3 { font-size: 1.05rem; font-weight: 600; margin: 0.4rem 0; }
        .rich-content blockquote { border-left: 3px solid #6366f1; padding-left: 0.75rem; color: #64748b; margin: 0.5rem 0; font-style: italic; }
        .rich-content ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rich-content ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rich-content a { color: #4f46e5; text-decoration: underline; }
        .rich-content p { margin: 0.25rem 0; }
        .rich-content b, .rich-content strong { font-weight: 700; }
      `}</style>
    </div>
  )
}

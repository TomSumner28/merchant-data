import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)

  const [draftInput, setDraftInput] = useState('')
  const [draftResponse, setDraftResponse] = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [tone, setTone] = useState('general')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loadingChat])

  const sendChat = async () => {
    if (!chatInput) return
    setLoadingChat(true)
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: chatInput, history: chatHistory })
    })
    const data = await res.json()
    setChatHistory([...chatHistory, { role: 'user', content: chatInput }, { role: 'assistant', content: data.result }])
    setChatInput('')
    setLoadingChat(false)
  }

  const newChat = () => {
    setChatHistory([])
    setChatInput('')
  }

  const handleDraft = async () => {
    if (!draftInput) return
    setLoadingDraft(true)
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: draftInput, email: true, tone })
    })
    const data = await res.json()
    setDraftResponse(data.result)
    setLoadingDraft(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#5ec2f7' }}>Ask TRC</h2>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{ marginRight: '1rem' }}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <button onClick={newChat}>New Chat</button>
      </div>
      {!collapsed && (
        <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20, background: '#1a1a1a', padding: 10 }}>
          {chatHistory.map((m, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <strong>{m.role === 'user' ? 'You' : 'TRC'}:</strong> {m.content}
            </div>
          ))}
          {loadingChat && <p>Thinking...</p>}
          <div ref={bottomRef} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 40 }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask a question"
          style={{ flex: 1, padding: 10 }}
          onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
        />
        <button onClick={sendChat} style={{ padding: '10px 20px' }}>Send</button>
      </div>

      <h2>Draft Reply</h2>
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={draftInput}
          onChange={(e) => setDraftInput(e.target.value)}
          placeholder="Paste an email or prompt"
          rows={10}
          style={{ padding: 10, width: '100%' }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleDraft} style={{ padding: '10px 20px' }}>Generate</button>
          <label style={{ color: '#5ec2f7' }}>
            Tone Enhancer:
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              <option value="general">General</option>
              <option value="sales">Sales</option>
              <option value="account manager">Account Manager</option>
              <option value="credit control">Credit Control</option>
              <option value="legal">Legal</option>
              <option value="exec team">Exec Team</option>
            </select>
          </label>
        </div>
      </div>
      {loadingDraft && <p>Thinking...</p>}
      {draftResponse && (
        <div style={{ marginBottom: 20, backgroundColor: '#1a1a1a', padding: 10 }}>
          <strong>Email Response:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{draftResponse}</pre>
        </div>
      )}
    </div>
  )
}

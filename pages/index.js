import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [weeklyUpdate, setWeeklyUpdate] = useState('')
  const [updateInput, setUpdateInput] = useState('')
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

  useEffect(() => {
    const wu = localStorage.getItem('weeklyUpdate')
    if (wu) setWeeklyUpdate(wu)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('chatHistory')
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
  }, [chatHistory])

  useEffect(() => {
    if (weeklyUpdate) {
      localStorage.setItem('weeklyUpdate', weeklyUpdate)
    }
  }, [weeklyUpdate])

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

  const generateUpdate = async () => {
    if (!updateInput) return
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekly: true, query: updateInput })
    })
    const data = await res.json()
    setWeeklyUpdate(data.result)
    setUpdateInput('')
  }

  return (
    <div className="content">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Weekly Company Update</h2>
        {weeklyUpdate ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{weeklyUpdate}</p>
        ) : (
          <p>No update available.</p>
        )}
      </div>
      <div className="card">
        <h2 style={{ color: 'var(--accent)' }}>Ask TRC</h2>
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ marginRight: '1rem' }}>
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button onClick={newChat}>New Chat</button>
        </div>
        {!collapsed && (
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }} className="card">
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
            style={{ flex: 1, padding: 10, borderRadius: 18, border: '1px solid var(--primary)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
          />
          <button onClick={sendChat} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 18 }}>Send</button>
        </div>
      </div>

      <div className="card">
        <h2>Draft Reply</h2>
        <textarea
          value={draftInput}
          onChange={(e) => setDraftInput(e.target.value)}
          placeholder="Paste an email or prompt"
          rows={10}
          style={{ padding: 10, width: '100%', borderRadius: 18, border: '1px solid var(--primary)' }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleDraft} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 18 }}>Generate</button>
          <label style={{ color: 'var(--accent)' }}>
            Tone Enhancer:
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ marginLeft: '0.5rem', borderRadius: 8 }}>
              <option value="general">General</option>
              <option value="sales">Sales</option>
              <option value="account manager">Account Manager</option>
              <option value="credit control">Credit Control</option>
              <option value="legal">Legal</option>
              <option value="exec team">Exec Team</option>
            </select>
          </label>
        </div>
        {loadingDraft && <p>Thinking...</p>}
        {draftResponse && (
          <div style={{ marginTop: 20 }} className="card">
            <strong>Email Response:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{draftResponse}</pre>
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ color: 'var(--accent)' }}>Create Weekly Update</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 10 }}>
          <textarea
            value={updateInput}
            onChange={(e) => setUpdateInput(e.target.value)}
            placeholder="Enter bullet points"
            rows={1}
            style={{ flex: 1, padding: 10, borderRadius: 18, border: '1px solid var(--primary)', resize: 'vertical' }}
          />
          <button onClick={generateUpdate} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 18 }}>Generate Update</button>
        </div>
      </div>
    </div>
  )
}

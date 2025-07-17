import { useState } from 'react'

export default function Home() {
  const [askInput, setAskInput] = useState('')
  const [askResponse, setAskResponse] = useState('')
  const [loadingAsk, setLoadingAsk] = useState(false)

  const [draftInput, setDraftInput] = useState('')
  const [draftResponse, setDraftResponse] = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)

  const handleAsk = async () => {
    if (!askInput) return
    setLoadingAsk(true)
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: askInput })
    })
    const data = await res.json()
    setAskResponse(data.result)
    setLoadingAsk(false)
  }

  const handleDraft = async () => {
    if (!draftInput) return
    setLoadingDraft(true)
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: draftInput, email: true })
    })
    const data = await res.json()
    setDraftResponse(data.result)
    setLoadingDraft(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#5ec2f7' }}>Ask TRC</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={askInput}
          onChange={(e) => setAskInput(e.target.value)}
          placeholder="Ask a question"
          style={{ padding: 10, width: '100%' }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleAsk} style={{ padding: '10px 20px' }}>Submit</button>
        </div>
      </div>
      {loadingAsk && <p>Thinking...</p>}
      {askResponse && (
        <div style={{ marginBottom: 20, backgroundColor: '#1a1a1a', padding: 10 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{askResponse}</pre>
        </div>
      )}

      <h2>Draft Reply</h2>
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={draftInput}
          onChange={(e) => setDraftInput(e.target.value)}
          placeholder="Paste an email or prompt"
          rows={10}
          style={{ padding: 10, width: '100%' }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleDraft} style={{ padding: '10px 20px' }}>Generate</button>
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

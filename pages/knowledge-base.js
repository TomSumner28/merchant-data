import { useState, useEffect } from 'react'

export default function KnowledgeBase() {

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/files')
      const json = await res.json()
      if (res.ok) {
        setFiles(json.files)
      } else {
        setError(json.error || 'Failed to load files')
        setFiles([])
      }
    } catch (e) {
      setError('Failed to load files')
      setFiles([])
    }
    setLoading(false)
  }

  async function syncBackend() {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-knowledge-base', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ Synced ${data.processed} new files, skipped ${data.skipped} existing.`)
      } else {
        alert(data.error || 'Sync failed')
      }
    } catch (e) {
      alert('Sync failed')
    }
    setSyncing(false)
    fetchFiles()
  }



  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
      <p>Files stored in Supabase are listed below.</p>
      <button onClick={syncBackend} disabled={syncing} style={{ marginBottom: '1rem' }}>
        {syncing ? 'Syncing...' : 'Sync with Backend'}
      </button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && files.length === 0 && <p>No files found</p>}
      <ul>
        {files.map((f) => (
          <li key={f.file_url} style={{ marginBottom: 10 }}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {f.file_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

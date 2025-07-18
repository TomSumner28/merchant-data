import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function KnowledgeBase() {

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.storage
      .from('knowledge-base')
      .list('', { limit: 100 })
    if (error) {
      setError(error.message)
      setFiles([])
    } else {
      setFiles(data || [])
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
          <li key={f.name} style={{ marginBottom: 10 }}>
            {f.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

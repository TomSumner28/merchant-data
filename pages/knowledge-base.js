import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function KnowledgeBase() {

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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



  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
      <p>Files stored in Supabase are listed below.</p>
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

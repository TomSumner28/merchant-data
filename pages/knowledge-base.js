import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function KnowledgeBase() {
  if (!supabase) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
        <p>Supabase is not configured. Provide environment variables to enable storage.</p>
      </div>
    )
  }

  const [files, setFiles] = useState([])

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase
      .storage
      .from('knowledge_base')
      .list('')

    if (error) {
      console.error('List error:', error)
      return
    }

    const items = data.map((f) => {
      const { data: urlData } = supabase.storage
        .from('knowledge_base')
        .getPublicUrl(f.name)
      return { file_name: f.name, file_url: f.name, url: urlData.publicUrl }
    })

    setFiles(items)
  }

  async function handleDelete(entry) {
    await supabase.storage.from('knowledge_base').remove([entry.file_url])
    await supabase
      .from('knowledge_base_entries')
      .delete()
      .eq('file_url', entry.file_url)
    await fetchFiles()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
      <p>Files stored in Supabase are listed below.</p>
      <ul>
        {files?.map((entry) => (
          <li key={entry.file_url} style={{ marginBottom: 10 }}>
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#5ec2f7' }}
            >
              {entry.file_name}
            </a>
            <button style={{ marginLeft: 10 }} onClick={() => handleDelete(entry)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

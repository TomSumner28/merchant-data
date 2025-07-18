import { useState, useEffect } from 'react'

export default function KnowledgeBase() {

  const [files, setFiles] = useState([])

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const res = await fetch('/api/files')
    const json = await res.json()
    setFiles(json.files || [])
  }

  async function handleDelete(entry) {
    await fetch(`/api/files?path=${encodeURIComponent(entry.file_url)}`, {
      method: 'DELETE'
    })
    fetchFiles()
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

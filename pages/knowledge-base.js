import { useState, useEffect, useRef } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase
      .storage
      .from('knowledge_base')
      .list('uploads')

    if (error) {
      console.error('List error:', error)
      return
    }

    const items = data.map((f) => {
      const { data: urlData } = supabase.storage
        .from('knowledge_base')
        .getPublicUrl(`uploads/${f.name}`)
      return { file_name: f.name, file_url: `uploads/${f.name}`, url: urlData.publicUrl }
    })

    setFiles(items)
  }

  async function handleUpload(e) {
    const fileList = e.target.files
    if (!fileList?.length) return
    setUploading(true)
    setMessage('')
    const formData = new FormData()
    Array.from(fileList).forEach((f) => formData.append('files', f))
    const res = await fetch('/api/upload-knowledge', {
      method: 'POST',
      body: formData,
    })
    const out = await res.json()
    if (res.ok) {
      setMessage(`Uploaded ${out.uploaded.length} file(s)`)
    } else {
      setMessage(out.error || 'Upload failed')
    }
    setUploading(false)
    await fetchFiles()
  }

  async function handleDelete(entry) {
    await supabase.storage.from('knowledge_base').remove([entry.file_url])
    await supabase
      .from('knowledge_base_entries')
      .delete()
      .eq('file_url', entry.file_url)
    await fetchFiles()
  }

  function triggerSelect() {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
      <div
        style={{ marginBottom: 20, border: '2px dashed #555', padding: 20 }}
        onClick={triggerSelect}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleUpload({ target: { files: e.dataTransfer.files } })
        }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <p>Click or drag files here to upload</p>
      </div>
      {uploading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
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

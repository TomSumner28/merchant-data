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
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    const { data, error } = await supabase.storage.from('knowledge-base').list('', {limit: 100})
    if (!error) setFiles(data)
  }

  async function handleUpload(e) {
    const fileList = e.target.files
    if (!fileList?.length) return
    setUploading(true)
    for (const file of fileList) {
      await supabase.storage.from('knowledge-base').upload(file.name, file, { upsert: true })
    }
    setUploading(false)
    await fetchFiles()
  }

  async function handleDelete(name) {
    await supabase.storage.from('knowledge-base').remove([name])
    await fetchFiles()
  }

  function triggerSelect() {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Knowledge Base</h1>
      <div style={{ marginBottom: 20, border: '2px dashed #555', padding: 20 }}
           onClick={triggerSelect}
           onDragOver={e => e.preventDefault()}
           onDrop={e => { e.preventDefault(); handleUpload({target:{files:e.dataTransfer.files}})}}>
        <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
        <p>Click or drag files here to upload</p>
      </div>
      {uploading && <p>Uploading...</p>}
      <ul>
        {files?.map(f => (
          <li key={f.name} style={{ marginBottom: 10 }}>
            {f.name}
            <button style={{ marginLeft: 10 }} onClick={() => handleDelete(f.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

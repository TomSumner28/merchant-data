import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Testing() {
  const [merchants, setMerchants] = useState([])
  const [publishers, setPublishers] = useState([])
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    async function fetchData() {
      const [merchantsRes, publishersRes, entriesRes] = await Promise.all([
        supabase.from('Merchants').select('*').limit(50),
        supabase.from('Publishers').select('*').limit(50),
        supabase
          .from('knowledge_base_entries')
          .select('*')
          .order('uploaded_at', { ascending: false })
      ])
      if (merchantsRes.error || publishersRes.error || entriesRes.error) {
        console.error(merchantsRes.error || publishersRes.error || entriesRes.error)
        setError('Failed to load data')
      }
      setMerchants(merchantsRes.data || [])
      setPublishers(publishersRes.data || [])
      setEntries(entriesRes.data || [])
    }
    fetchData()
  }, [])

  const renderJSON = (data) => (
    <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Testing</h1>
      {error && <p>{error}</p>}
      <h2>Merchants ({merchants.length})</h2>
      {renderJSON(merchants)}
      <h2>Publishers ({publishers.length})</h2>
      {renderJSON(publishers)}
      <h2>Knowledge Base Entries ({entries.length})</h2>
      {renderJSON(entries)}
    </div>
  )
}

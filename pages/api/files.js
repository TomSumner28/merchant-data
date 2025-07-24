import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  if (req.method === 'GET') {
    const prefixes = ['', 'uploads']
    const files = []

    for (const prefix of prefixes) {
      const { data, error } = await supabase.storage
        .from('knowledge_base')
        .list(prefix)
      if (error) {
        console.error('List error:', error)
        continue
      }
      if (data) {
        for (const f of data) {
          const path = prefix ? `${prefix}/${f.name}` : f.name
          const { data: urlData } = supabase.storage
            .from('knowledge_base')
            .getPublicUrl(path)
          files.push({ file_name: f.name, file_url: path, url: urlData.publicUrl })
        }
      }
    }

    return res.status(200).json({ files })
  }

  if (req.method === 'DELETE') {
    const { path } = req.query
    if (!path) {
      return res.status(400).json({ error: 'path required' })
    }

    await supabase.storage.from('knowledge_base').remove([path])
    await supabase.from('knowledge_base_entries').delete().eq('file_url', path)
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

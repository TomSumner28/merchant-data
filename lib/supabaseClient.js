import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export async function uploadKnowledgeFile(file) {
  if (!supabase) {
    console.warn('Supabase is not configured')
    return null
  }
  const { data, error } = await supabase
    .storage
    .from('knowledge-base')
    .upload(`uploads/${file.name}`, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  return data?.path
}

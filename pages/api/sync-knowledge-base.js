import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Tesseract from 'tesseract.js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null

async function extractText(buffer, ext) {
  switch (ext) {
    case 'pdf':
      return (await pdfParse(buffer)).text
    case 'docx':
      return (await mammoth.extractRawText({ buffer })).value
    case 'xlsx': {
      const wb = XLSX.read(buffer, { type: 'buffer' })
      return wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')
    }
    case 'png':
    case 'jpg':
    case 'jpeg':
      try {
        const result = await Tesseract.recognize(buffer, 'eng')
        return result.data.text
      } catch (e) {
        console.error('OCR error:', e)
        return ''
      }
    default:
      return ''
  }
}

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const prefixes = ['', 'uploads']
  let allFiles = []
  for (const prefix of prefixes) {
    const { data, error } = await supabase.storage
      .from('knowledge_base')
      .list(prefix)
    if (error) {
      console.error('List error:', error)
      continue
    }
    if (data) {
      allFiles = allFiles.concat(
        data
          .filter((f) => f.metadata) // skip folders
          .map((f) => ({
            name: f.name,
            path: prefix ? `${prefix}/${f.name}` : f.name,
          }))
      )
    }
  }

  let processed = 0
  let skipped = 0

  for (const file of allFiles) {
    const fileName = file.name
    const filePath = file.path

    const { data: existing } = await supabase
      .from('knowledge_base_entries')
      .select('id')
      .eq('file_url', filePath)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { data: downloadData, error: downloadErr } = await supabase.storage
      .from('knowledge_base')
      .download(filePath)
    if (downloadErr || !downloadData) {
      console.error('Download error:', downloadErr)
      continue
    }

    const buffer = Buffer.from(await downloadData.arrayBuffer())
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    let text = ''
    try {
      text = await extractText(buffer, ext)
    } catch (e) {
      console.error('Extract error:', e)
    }

    const { data: publicData } = supabase.storage
      .from('knowledge_base')
      .getPublicUrl(filePath)

    await supabase.from('knowledge_base_entries').insert({
      file_name: fileName,
      file_url: publicData.publicUrl,
      file_type: ext,
      extracted_text: text,
    })

    processed++
  }

  return res.status(200).json({ processed, skipped })
}

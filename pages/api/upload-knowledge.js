import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Tesseract from 'tesseract.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

async function parseFile(file, type) {
  const buffer = await fs.promises.readFile(file.filepath)
  switch (type) {
    case 'pdf':
      return (await pdfParse(buffer)).text
    case 'docx':
      return (await mammoth.extractRawText({ buffer })).value
    case 'xlsx':
      const wb = XLSX.read(buffer, { type: 'buffer' })
      return wb.SheetNames
        .map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name]))
        .join('\n')
    case 'png':
    case 'jpg':
    case 'jpeg':
      const result = await Tesseract.recognize(buffer, 'eng')
      return result.data.text
    default:
      return ''
  }
}

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: 'Failed to parse form' })
    }

    const uploaded = []
    const fileArray = Array.isArray(files.files) ? files.files : [files.files]

    for (const file of fileArray) {
      const ext = file.originalFilename.split('.').pop().toLowerCase()
      const path = `uploads/${Date.now()}_${file.originalFilename}`

      const { error: upErr } = await supabase.storage
        .from('knowledge_base')
        .upload(path, fs.createReadStream(file.filepath), {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        })

      if (upErr) {
        console.error('Upload error:', upErr)
        continue
      }

      let text = ''
      try {
        text = await parseFile(file, ext)
      } catch (e) {
        console.error('Parse error:', e)
      }

      await supabase.from('knowledge_base_entries').insert({
        file_name: file.originalFilename,
        file_url: path,
        file_type: ext,
        extracted_text: text,
      })

      uploaded.push({ name: file.originalFilename })
    }

    res.status(200).json({ uploaded })
  })
}


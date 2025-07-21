import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

function extractClauseFromText(text, clause) {
  if (!text) return null
  const lines = text.split(/\n+/)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(clause.toLowerCase())) {
      let out = lines[i]
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\d+(\.\d+)*\b/.test(lines[j].trim())) break
        out += ' ' + lines[j]
      }
      return out.trim()
    }
  }
  return null
}

async function fetchClauseText(clauseNum) {
  if (!supabase) return null
  const { data } = await supabase
    .from('knowledge_base_entries')
    .select('extracted_text')
    .ilike('extracted_text', `%${clauseNum}%`)

  if (data?.length) {
    for (const row of data) {
      const snippet = extractClauseFromText(row.extracted_text, clauseNum)
      if (snippet) return snippet
    }
  }

  try {
    const resp = await axios.get(
      'https://therewardcollection.com/master-general-service-agreement/'
    )
    const plain = resp.data.replace(/<[^>]+>/g, ' ')
    return extractClauseFromText(plain, clauseNum)
  } catch (e) {
    console.error('fetch clause error', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, email, short, tone, history = [] } = req.body

  console.log('Received query:', query)

  try {
    let systemMessage = 'You are a helpful assistant. Only answer using the provided context. If the information is not in the context, respond with "This information is not available in our records."'
    let supabaseContext = ''

    const tableMap = {
      retailer: 'Merchants',
      retailers: 'Merchants',
      merchant: 'Merchants',
      merchants: 'Merchants',
      partner: 'Publishers',
      partners: 'Publishers',
      publisher: 'Publishers',
      publishers: 'Publishers'
    }

    const statusMap = {
      live: 'live',
      active: 'live',
      enabled: 'live'
    }

    const regionMap = {
      usa: 'USA',
      'united states': 'USA',
      us: 'USA',
      canada: 'Canada',
      uk: 'UK',
      'united kingdom': 'UK'
    }

    const parseIntent = (text) => {
      const lower = text.toLowerCase()
      const info = {}

      for (const [syn, table] of Object.entries(tableMap)) {
        if (lower.includes(syn)) {
          info.table = table
          break
        }
      }

      if (/how many|count|number of/.test(lower)) info.action = 'count'
      if (/\blist\b|which|show/.test(lower)) info.action = info.action || 'list'

      for (const [syn, status] of Object.entries(statusMap)) {
        if (lower.includes(syn)) {
          info.status = status
          break
        }
      }

      for (const [syn, region] of Object.entries(regionMap)) {
        if (lower.includes(syn)) {
          info.region = region
          break
        }
      }

      const regionMatch = lower.match(/in(?: the)? ([a-z ]+)/)
      if (regionMatch && !info.region) {
        const region = regionMatch[1].trim()
        info.region = regionMap[region] || region
      }

      return info
    }

    if (supabase) {
      const intent = parseIntent(query)
      console.log('Parsed intent:', intent)
      const clauseMatch = query.match(/clause\s*(\d+(?:\.\d+)?)/i)
      if (clauseMatch) {
        const clauseNum = clauseMatch[1]
        const clauseText = await fetchClauseText(clauseNum)
        console.log('Clause lookup:', clauseText ? 'found' : 'not found')
        if (clauseText) {
          return res.status(200).json({ result: `Clause ${clauseNum}: ${clauseText}` })
        }
        return res.status(200).json({ result: `Clause ${clauseNum} is not present in our current contract.` })
      }

      if (intent.table && intent.action === 'count') {
        let qb = supabase.from(intent.table).select('*', { count: 'exact', head: true })
        if (intent.status) qb = qb.eq('status', intent.status)
        if (intent.region) qb = qb.ilike('region', `%${intent.region}%`)
        const { count = 0, error } = await qb
        console.log('Count query', { table: intent.table, count, error })
        if (!count) {
          return res.status(200).json({ result: 'We could not find any matching entries for your request.' })
        }
        return res.status(200).json({ result: `There are ${count} ${intent.status ? intent.status + ' ' : ''}${intent.table.toLowerCase()}${intent.region ? ` in ${intent.region}` : ''}.` })
      }

      if (intent.table && intent.action === 'list') {
        let qb = supabase.from(intent.table).select('name')
        if (intent.status) qb = qb.eq('status', intent.status)
        if (intent.region) qb = qb.ilike('region', `%${intent.region}%`)
        const { data, error } = await qb
        console.log('List query', { table: intent.table, found: data?.length, error })
        if (!data?.length) {
          return res.status(200).json({ result: 'We could not find any matching entries for your request.' })
        }
        const names = data.map((d) => d.name).filter(Boolean)
        return res.status(200).json({ result: names.join(', ') })
      }

      const [merchants, publishers] = await Promise.all([
        supabase.from('Merchants').select('name'),
        supabase.from('Publishers').select('name')
      ])

      const merchantNames = merchants.data?.map((m) => m.name).filter(Boolean).join(', ') || ''
      const publisherNames = publishers.data?.map((p) => p.name).filter(Boolean).join(', ') || ''

      supabaseContext += merchantNames ? `Merchant names: ${merchantNames}.\n` : ''
      supabaseContext += publisherNames ? `Publisher names: ${publisherNames}.\n` : ''

      const { data: kb } = await supabase
        .from('knowledge_base_entries')
        .select('extracted_text')
        .textSearch('extracted_text', query, { type: 'websearch' })
        .order('uploaded_at', { ascending: false })
        .limit(5)
      if (kb?.length) {
        supabaseContext += kb.map((d) => d.extracted_text).join('\n').slice(0, 4000)
      }
    }

    if (email) {
      systemMessage = 'You are a helpful assistant that replies in a professional email format. Only answer using the provided context. If the information is not in the context, respond with "This information is not available in our records."'
      if (tone && tone !== 'general') {
        switch (tone) {
          case 'sales':
            systemMessage += ' Respond in the persuasive style of a sales professional.'
            break
          case 'account manager':
            systemMessage += ' Respond in the friendly and helpful style of an account manager.'
            break
          case 'credit control':
            systemMessage += ' Respond as someone from a credit control team would.'
            break
          case 'legal':
            systemMessage += ' Respond using precise legal language as a legal professional.'
            break
          case 'exec team':
            systemMessage += ' Respond with visionary executive flair, as if written by Steve Jobs.'
            break
          default:
            break
        }
      }
    } else if (short) {
      systemMessage = 'You answer timezone questions with only the converted time in HH:mm format without extra commentary.'
    }
    const messages = [
      { role: 'system', content: systemMessage },
    ]
    if (supabaseContext) {
      messages.push({ role: 'system', content: supabaseContext.slice(0, 4000) })
    }
    for (const m of history) {
      if (m.role && m.content) messages.push(m)
    }
    messages.push({ role: 'user', content: query })

    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const result = openaiRes.data.choices[0].message.content.trim();
    res.status(200).json({ result });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ result: 'Failed to fetch response from OpenAI.' });
  }
}

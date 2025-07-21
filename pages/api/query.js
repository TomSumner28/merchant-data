import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, email, short, tone } = req.body

  try {
    let systemMessage = 'You are a helpful assistant.'
    let supabaseContext = ''
    if (supabase) {
      const [merchants, publishers, kb] = await Promise.all([
        supabase.from('Merchants').select('*').limit(50),
        supabase.from('Publishers').select('*').limit(50),
        supabase
          .from('knowledge_base_entries')
          .select('*')
          .order('uploaded_at', { ascending: false })
      ])

      if (merchants.data) {
        supabaseContext += JSON.stringify(merchants.data) + '\n'
      }
      if (publishers.data) {
        supabaseContext += JSON.stringify(publishers.data) + '\n'
      }
      if (kb.data) {
        supabaseContext += kb.data.map((d) => d.extracted_text).join('\n')
      }
    }

    if (email) {
      systemMessage = 'You are a helpful assistant that replies in a professional email format.'
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

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, email } = req.body

  try {
    const systemMessage = email
      ? 'You are a helpful assistant that replies in a professional email format.'
      : 'You are a helpful assistant.'
    const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: query }
      ]
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

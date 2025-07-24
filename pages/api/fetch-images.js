import { NextResponse } from 'next/server'

export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url' })
  try {
    const resp = await fetch(url)
    const html = await resp.text()
    const matches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)]
    const base = new URL(url)
    const urls = []
    for (const m of matches) {
      let src = m[1]
      if (!src) continue
      if (!/^https?:\/\//i.test(src)) {
        try { src = new URL(src, base).href } catch {}
      }
      if (!urls.includes(src)) urls.push(src)
      if (urls.length >= 4) break
    }
    return res.status(200).json({ images: urls })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to fetch images' })
  }
}

import { useEffect, useState } from 'react'

const zones = [
  { label: 'UK - GMT', timeZone: 'Europe/London' },
  { label: 'Eastern Time (US)', timeZone: 'America/New_York' },
  { label: 'Central Time (US)', timeZone: 'America/Chicago' },
  { label: 'Mountain Time (US)', timeZone: 'America/Denver' },
  { label: 'Pacific Time (US)', timeZone: 'America/Los_Angeles' },
  { label: 'Alaska Time (US)', timeZone: 'America/Anchorage' },
  { label: 'Hawaii Time (US)', timeZone: 'Pacific/Honolulu' },
  { label: 'Atlantic Time (Canada)', timeZone: 'America/Halifax' },
  { label: 'Newfoundland Time (Canada)', timeZone: 'America/St_Johns' }
]

export default function TimeZoneTracker() {
  const [now, setNow] = useState(new Date())
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleAsk() {
    if (!query) return
    setLoading(true)
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, short: true })
    })
    const data = await res.json()
    setResponse(data.result)
    setLoading(false)
  }

  const formatTime = (tz) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz
    }).format(now)

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Time Zone Tracker</h1>
      <ul>
        {zones.map(({ label, timeZone }) => (
          <li key={label} style={{ marginBottom: 10 }}>
            {label}: {formatTime(timeZone)}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What time is it in the UK if it's 14:30 in UTC timezone"
          style={{ padding: 10, width: '100%' }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleAsk} style={{ padding: '10px 20px' }}>Ask</button>
        </div>
      </div>
      {loading && <p>Thinking...</p>}
      {response && (
        <div style={{ marginTop: 10, backgroundColor: '#1a1a1a', padding: 10 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
        </div>
      )}
    </div>
  )
}

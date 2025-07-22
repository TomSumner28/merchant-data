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
  const [hoverHour, setHoverHour] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
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

  const currentLondonHour = () => {
    const str = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' })
    return new Date(str).getHours()
  }

  function londonDateAtHour(hour) {
    const now = new Date()
    const baseStr = now.toLocaleString('en-US', { timeZone: 'Europe/London' })
    const base = new Date(baseStr)
    base.setHours(hour, 0, 0, 0)
    const utcStr = base.toLocaleString('en-US', { timeZone: 'UTC' })
    return new Date(utcStr)
  }

  const formatTime = (date, tz) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz
    }).format(date)

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="content">
      <div className="card">
        <h1 style={{ color: 'var(--accent)' }}>Time Zone Tracker</h1>
        <div className="timeline">
          {hours.map((h) => {
            const base = londonDateAtHour(h)
            const isCurrent = currentLondonHour() === h
            return (
              <div
                key={h}
                className={`hour-cell${isCurrent ? ' current' : ''}`}
                onMouseEnter={() => setHoverHour(h)}
                onMouseLeave={() => setHoverHour(null)}
              >
                {String(h).padStart(2, '0')}:00
                {hoverHour === h && (
                  <div className="tooltip">
                    {zones
                      .filter((z) => z.timeZone !== 'Europe/London')
                      .map((z) => (
                        <div key={z.label}>
                          {z.label}: {formatTime(base, z.timeZone)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 20 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          placeholder="What time is it in the UK if it's 14:30 in UTC timezone"
          style={{ padding: 10, width: '100%', borderRadius: 18, border: '1px solid var(--primary)' }}
        />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleAsk}
              style={{
                padding: '10px 20px',
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: 18
              }}
            >
              Ask
            </button>
          </div>
        </div>
        {loading && <p>Thinking...</p>}
        {response && (
          <div style={{ marginTop: 10 }} className="card">
            <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

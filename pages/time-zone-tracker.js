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

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

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
    </div>
  )
}

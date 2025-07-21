import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

  const linkColor = darkMode ? '#fff' : '#000'

  return (
    <>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: darkMode ? '#333' : '#eee' }}>
        <Link href="/" style={{ color: linkColor }}>Home</Link>
        <a href="https://forecasting.therewardcollection.com" target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>Forecasting</a>
        <Link href="/asset-creation" style={{ color: linkColor }}>Asset Creation</Link>
        <Link href="/external-tools" style={{ color: linkColor }}>External Tools</Link>
        <Link href="/time-zone-tracker" style={{ color: linkColor }}>Time Zone Tracker</Link>
        <Link href="/dashboard" style={{ color: linkColor }}>Dashboard</Link>
        <Link href="/testing" style={{ color: linkColor }}>Testing</Link>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp;

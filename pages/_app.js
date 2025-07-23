import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) setDarkMode(stored === 'true')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const [amOpen, setAmOpen] = useState(false)

  return (
    <>
      <nav className="navbar">
        <span className="logo">TRC</span>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <a href="https://forecasting.therewardcollection.com" target="_blank" rel="noopener noreferrer">Forecasting</a>
        <Link href="/asset-creation">Asset Creation</Link>
        <Link href="/external-tools">External Tools</Link>
        <Link href="/time-zone-tracker">Time Zone Tracker</Link>
        <div className="dropdown">
          <button onClick={() => setAmOpen(!amOpen)} className="dropbtn">Account Manager ▾</button>
          {amOpen && (
            <div className="dropdown-menu">
              <Link href="/automation-approvals">Automation Approvals</Link>
              <Link href="/rpf-automation">RPF Automation</Link>
            </div>
          )}
        </div>
        <div className="spacer" />
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </nav>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp;

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


  return (
    <>
      <nav className="navbar">
        <img
          src="https://hwglmudfkjctsdnyutsp.supabase.co/storage/v1/object/public/knowledge-base//TRC%20Logo.png"
          alt="The Reward Collection"
          className="logo"
        />
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <div className="dropdown">
          <span className="dropbtn">Account Manager ▾</span>
          <div className="dropdown-menu">
            <Link href="/approval-automation">Approval Automation</Link>
            <Link href="/rpf-automation">RPF Automation</Link>
            <Link href="/asset-creation">Asset Creation</Link>
          </div>
        </div>
        <div className="dropdown">
          <span className="dropbtn">Sales ▾</span>
          <div className="dropdown-menu">
            <Link href="/sales">Sales Home</Link>
            <a href="https://forecasting.therewardcollection.com" target="_blank" rel="noopener noreferrer">Forecasting</a>
          </div>
        </div>
       <Link href="/external-tools">External Tools</Link>
       <Link href="/time-zone-tracker">Time Zone Tracker</Link>
       <a
         href="https://notetaker.therewardcollection.com"
         target="_blank"
         rel="noopener noreferrer"
       >
         Note Taker
       </a>
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

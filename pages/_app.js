import Link from 'next/link';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#333' }}>
        <Link href="/" style={{ color: '#fff' }}>Home</Link>
        <a href="https://forecasting.therewardcollection.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>Forecasting</a>
        <Link href="/knowledge-base" style={{ color: '#fff' }}>Knowledge Base</Link>
        <Link href="/asset-creation" style={{ color: '#fff' }}>Asset Creation</Link>
        <Link href="/external-tools" style={{ color: '#fff' }}>External Tools</Link>
        <Link href="/time-zone-tracker" style={{ color: '#fff' }}>Time Zone Tracker</Link>
        <Link href="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>
      </nav>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

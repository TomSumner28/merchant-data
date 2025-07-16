import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query) return;
    setLoading(true);
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setResponse(data.result);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Ask TRC AI</h1>
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste an email or ask a question"
          rows={10}
          style={{ padding: 10, width: '100%' }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleQuery} style={{ padding: '10px 20px' }}>Ask AI</button>
        </div>
      </div>
      {loading && <p>Thinking...</p>}
      {response && (
        <div style={{ marginBottom: 20, backgroundColor: '#1a1a1a', padding: 10 }}>
          <strong>Email Response:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
        </div>
      )}
    </div>
  );
}

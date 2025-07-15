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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question"
          style={{ padding: 10, width: '60%' }}
        />
        <button onClick={handleQuery} style={{ marginLeft: 10, padding: '10px 20px' }}>Ask AI</button>
      </div>
      {loading && <p>Thinking...</p>}
      {response && (
        <div style={{ marginBottom: 20, backgroundColor: '#1a1a1a', padding: 10 }}>
          <strong>AI Response:</strong> {response}
        </div>
      )}
    </div>
  );
}

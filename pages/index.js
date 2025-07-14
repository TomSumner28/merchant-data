import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const dummyData = [
  { month: 'Jan', UK: 12, US: 9, Total: 21 },
  { month: 'Feb', UK: 14, US: 10, Total: 24 },
  { month: 'Mar', UK: 13, US: 12, Total: 25 },
  { month: 'Apr', UK: 15, US: 11, Total: 26 },
];

export default function Home() {
  const [showRegions, setShowRegions] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleQuery = async () => {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setResponse(data.result);
  };

  return (
    <div style={{ padding: 20, background: '#0a0a0a', color: '#fff', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#5ec2f7' }}>The Reward Collection - Retailer Dashboard</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question (e.g. How many US retailers are live?)"
          style={{ padding: 10, width: '60%' }}
        />
        <button onClick={handleQuery} style={{ marginLeft: 10, padding: '10px 20px' }}>Ask AI</button>
      </div>
      {response && (
        <div style={{ marginBottom: 20, backgroundColor: '#1a1a1a', padding: 10 }}>
          <strong>AI Response:</strong> {response}
        </div>
      )}
      <label>
        <input type="checkbox" checked={showRegions} onChange={() => setShowRegions(!showRegions)} />
        Show region breakdown
      </label>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dummyData}>
          <XAxis dataKey="month" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Total" stroke="#5ec2f7" />
          {showRegions && (
            <>
              <Line type="monotone" dataKey="UK" stroke="#a6e3e9" />
              <Line type="monotone" dataKey="US" stroke="#f9a826" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
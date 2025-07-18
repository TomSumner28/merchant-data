import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const dummyData = [
  { month: 'Jan', UK: 12, US: 9, Total: 21 },
  { month: 'Feb', UK: 14, US: 10, Total: 24 },
  { month: 'Mar', UK: 13, US: 12, Total: 25 },
  { month: 'Apr', UK: 15, US: 11, Total: 26 },
];

export default function Dashboard() {
  const [showRegions, setShowRegions] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Dashboard</h1>
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
      <div style={{ marginTop: 20 }}>
        <h3>Metrics (coming from TRC Masterlist and emails)</h3>
        <ul>
          <li>Total emails sent: 120</li>
          <li>Live retailers UK: 35</li>
          <li>Live retailers US: 28</li>
        </ul>
      </div>
    </div>
  );
}

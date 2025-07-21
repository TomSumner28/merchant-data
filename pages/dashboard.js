import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const [merchants, setMerchants] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    async function load() {
      const { data, error } = await supabase.from('Merchants').select('*')
      if (error) {
        console.error(error)
        setError('Failed to load data')
      } else {
        setMerchants(data || [])
      }
    }
    load()
  }, [])

  const regionCounts = {}
  const paymentCounts = {}
  const statusCounts = {}
  let cashbackSum = 0
  let cashbackNum = 0

  merchants.forEach((m) => {
    const region = m.region || 'Unknown'
    regionCounts[region] = (regionCounts[region] || 0) + 1

    const method = m.payment_method || 'Unknown'
    paymentCounts[method] = (paymentCounts[method] || 0) + 1

    const status = m.status || 'Unknown'
    statusCounts[status] = (statusCounts[status] || 0) + 1

    const cb = parseFloat(m.cashback)
    if (!isNaN(cb)) {
      cashbackSum += cb
      cashbackNum += 1
    }
  })

  const totalRetailers = merchants.length
  const avgCashback = cashbackNum ? cashbackSum / cashbackNum : 0

  const regionData = Object.entries(regionCounts).map(([region, count]) => ({ region, count }))
  const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({ method, count }))
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  const COLORS = ['#5ec2f7', '#a6e3e9', '#f9a826', '#82ca9d', '#8884d8']

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Dashboard</h1>
      {error && <p>{error}</p>}
      <p>Total retailers: {totalRetailers}</p>
      <p>Average cashback: {avgCashback.toFixed(2)}</p>

      <h3>Retailers by Region</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={regionData}>
          <XAxis dataKey="region" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Bar dataKey="count" fill="#5ec2f7" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Retailers by Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={statusData}>
          <XAxis dataKey="status" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Bar dataKey="count" fill="#a6e3e9" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Payment Methods</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={paymentData} dataKey="count" nameKey="method" outerRadius={100} label>
            {paymentData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

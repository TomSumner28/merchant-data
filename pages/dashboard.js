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
  const [publishers, setPublishers] = useState([])
  const [view, setView] = useState('merchants')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    async function load() {
      const [mRes, pRes] = await Promise.all([
        supabase.from('Merchants').select('*'),
        supabase.from('Publishers').select('*')
      ])
      if (mRes.error || pRes.error) {
        console.error(mRes.error || pRes.error)
        setError('Failed to load data')
      } else {
        setMerchants(mRes.data || [])
        setPublishers(pRes.data || [])
      }
    }
    load()
  }, [])

  const regionCounts = {}
  const paymentCounts = {}
  const statusCounts = {}
  let cashbackSum = 0
  let cashbackNum = 0

  const reachByPub = {}
  const newCustomerCounts = { Yes: 0, No: 0 }
  let totalReach = 0

  if (view === 'merchants') {
    merchants.forEach((m) => {
      const region = m["Countries"] || 'Unknown'
      regionCounts[region] = (regionCounts[region] || 0) + 1

      const method = m["Billing Type"] || 'Unknown'
      paymentCounts[method] = (paymentCounts[method] || 0) + 1

      const status = m["Deal Stage"] || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1

      const cb = parseFloat(m["New Cashback"])
      if (!isNaN(cb)) {
        cashbackSum += cb
        cashbackNum += 1
      }
    })
  } else {
    publishers.forEach((p) => {
      const pub = p["Network_Publishers"] || 'Unknown'
      const reach = parseFloat(p["Reach"]) || 0
      reachByPub[pub] = (reachByPub[pub] || 0) + reach
      totalReach += reach

      const can = (p["New_Customers"] || '').toLowerCase().startsWith('y') ? 'Yes' : 'No'
      newCustomerCounts[can] = (newCustomerCounts[can] || 0) + reach
    })
  }

  const totalRetailers = merchants.length
  const avgCashback = cashbackNum ? cashbackSum / cashbackNum : 0
  const regionData = Object.entries(regionCounts).map(([region, count]) => ({ region, count }))
  const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({ method, count }))
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  const reachData = Object.entries(reachByPub).map(([publisher, reach]) => ({ publisher, reach }))
  const newCustomerData = Object.entries(newCustomerCounts).map(([type, reach]) => ({ type, reach }))

  const COLORS = ['#5ec2f7', '#a6e3e9', '#f9a826', '#82ca9d', '#8884d8']

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: '#5ec2f7' }}>Dashboard</h1>
      {error && <p>{error}</p>}
      <div style={{ marginBottom: 10 }}>
        <label style={{ marginRight: '1rem' }}>
          View:
          <select value={view} onChange={(e) => setView(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="merchants">Merchants</option>
            <option value="publishers">Publishers</option>
          </select>
        </label>
      </div>
      {view === 'merchants' && (
        <>
          <p>Total retailers: {totalRetailers}</p>
          <p>Average cashback: {avgCashback.toFixed(2)}</p>
        </>
      )}
      {view === 'publishers' && (
        <p>Total reach: {totalReach}</p>
      )}

      {view === 'merchants' && (
        <>
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
        </>
      )}

      {view === 'publishers' && (
        <>
          <h3>Reach by Publisher</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reachData}>
              <XAxis dataKey="publisher" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="reach" fill="#5ec2f7" />
            </BarChart>
          </ResponsiveContainer>

          <h3>New Customer Offers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={newCustomerData} dataKey="reach" nameKey="type" outerRadius={100} label>
                {newCustomerData.map((entry, index) => (
                  <Cell key={`cell-p-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

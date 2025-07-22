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

function parseRegions(str) {
  if (!str) return []
  const lower = str.toLowerCase()
  const regions = []
  if (/(^|,|\s)(uk|united kingdom|great britain|gb)(,|\s|$)/.test(lower)) {
    regions.push('UK')
  }
  if (/(^|,|\s)(eu|europe)(,|\s|$)/.test(lower)) {
    regions.push('Europe')
  }
  if (/(^|,|\s)(usa|united states|us|america)(,|\s|$)/.test(lower)) {
    regions.push('USA')
  }
  return Array.from(new Set(regions))
}

function MultiSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(!open)
  const handle = (opt) => {
    const newVal = value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt]
    onChange(newVal)
  }
  return (
    <div className="multi-select">
      <span onClick={toggle} className="multi-select-toggle">
        {label}: {value.length ? value.join(', ') : 'Any'}
      </span>
      {open && (
        <div className="multi-select-options">
          {options.map((opt) => (
            <label key={opt} className="option-row">
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => handle(opt)}
              />{' '}
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [merchants, setMerchants] = useState([])
  const [publishers, setPublishers] = useState([])
  const [view, setView] = useState('merchants')
  const [error, setError] = useState('')
  const [targetFilters, setTargetFilters] = useState({
    regions: [],
    click: '',
    minmax: '',
    newCustomer: '',
    firstTime: '',
    budgets: '',
    refunds: '',
    fixed: ''
  })

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
  const salesRepCounts = {}
  const verticalCounts = {}
  const tacticalCounts = { Always: 0, Tactical: 0 }
  const leadSourceCounts = {}
  let totalStores = 0
  let cashbackSum = 0
  let cashbackNum = 0

  const reachByPub = {}
  const subPubsByPub = {}
  const reachBySub = {}
  const newCustomerCounts = { Yes: 0, No: 0 }
  const newCustomerNames = { Yes: [], No: [] }
  const regionReach = {}
  let totalReach = 0

  if (view === 'merchants') {
    merchants.forEach((m) => {
      const regions = parseRegions(m["Countries"])
      if (regions.length === 0) {
        regionCounts['Other'] = (regionCounts['Other'] || 0) + 1
      } else {
        regions.forEach((r) => {
          regionCounts[r] = (regionCounts[r] || 0) + 1
        })
      }

      const method = m["Billing Type"] || 'Unknown'
      paymentCounts[method] = (paymentCounts[method] || 0) + 1

      const status = m["Deal Stage"] || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1

      const rep = m["Sales Rep"] || 'Unknown'
      salesRepCounts[rep] = (salesRepCounts[rep] || 0) + 1

      const vertical = m["Sales Vertical"] || 'Unknown'
      verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1

      const tactic = (m["Always On/Tactical"] || '').toLowerCase().startsWith('a') ? 'Always' : 'Tactical'
      tacticalCounts[tactic] = (tacticalCounts[tactic] || 0) + 1

      const lead = m["Lead Source"] || 'Unknown'
      leadSourceCounts[lead] = (leadSourceCounts[lead] || 0) + 1

      const stores = parseInt(m["No. of Stores"])
      if (!isNaN(stores)) totalStores += stores

      const cb = parseFloat(m["New Cashback"])
      if (!isNaN(cb)) {
        cashbackSum += cb
        cashbackNum += 1
      }
    })
  } else {
    publishers.forEach((p) => {
      const pub = p["Network_Publishers"] || 'Unknown'
      const sub = p["Sub_Publishers"] || ''
      const reachVal = (p["Reach"] || '').toString().replace(/,/g, '')
      const reach = parseFloat(reachVal) || 0
      reachByPub[pub] = (reachByPub[pub] || 0) + reach
      if (!subPubsByPub[pub]) subPubsByPub[pub] = new Set()
      sub.split(',').forEach((s) => {
        const t = s.trim()
        if (!t) return
        subPubsByPub[pub].add(t)
        reachBySub[t] = (reachBySub[t] || 0) + reach
      })

      totalReach += reach

      const regions = parseRegions(p["Regions"])
      if (regions.length === 0) {
        regionReach['Other'] = (regionReach['Other'] || 0) + reach
      } else {
        regions.forEach((r) => {
          regionReach[r] = (regionReach[r] || 0) + reach
        })
      }

      const can = (p["New_Customers"] || '').toLowerCase().startsWith('y') ? 'Yes' : 'No'
      newCustomerCounts[can] = (newCustomerCounts[can] || 0) + reach
      if (p["Network_Publishers"]) {
        newCustomerNames[can].push(p["Network_Publishers"])
      }
    })
  }

  const totalRetailers = merchants.length
  const avgCashback = cashbackNum ? cashbackSum / cashbackNum : 0
  const orderedRegions = ['UK', 'Europe', 'USA', 'Other']
  const regionData = orderedRegions
    .map((r) => ({ region: r, count: regionCounts[r] || 0 }))
    .filter((d) => d.count > 0)
  const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({ method, count }))
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
  const salesRepData = Object.entries(salesRepCounts).map(([rep, count]) => ({ rep, count }))
  const verticalData = Object.entries(verticalCounts).map(([vert, count]) => ({ vertical: vert, count }))
  const tacticData = Object.entries(tacticalCounts).map(([type, count]) => ({ type, count }))
  const leadSourceData = Object.entries(leadSourceCounts).map(([source, count]) => ({ source, count }))

  const topMerchants = merchants
    .map((m) => {
      const raw = (m["Revenue (£m)"] || '').toString()
      const num = parseFloat(raw.replace(/[^0-9.]+/g, ''))
      return { name: m["Merchant"], revenue: isNaN(num) ? 0 : num }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const reachData = Object.entries(reachByPub).map(([publisher, reach]) => ({
    publisher,
    reach,
    subs: Array.from(subPubsByPub[publisher] || [])
  })).sort((a, b) => b.reach - a.reach)

  const subReachData = Object.entries(reachBySub).map(([sub, reach]) => ({
    sub,
    reach
  })).sort((a, b) => b.reach - a.reach)

  const regionReachData = ['UK', 'Europe', 'USA', 'Other']
    .map((r) => ({ region: r, reach: regionReach[r] || 0 }))
    .filter((d) => d.reach > 0)

  const newCustomerData = Object.entries(newCustomerCounts).map(([type, reach]) => ({ type, reach }))

  const regionOptions = Array.from(
    new Set(publishers.flatMap((p) => parseRegions(p['Regions'])))
  ).filter(Boolean)

  const filteredPublishers = publishers
    .map((p) => {
      const pubRegions = parseRegions(p['Regions'])
      const toYesNo = (val) =>
        (val || '').toString().toLowerCase().startsWith('y') ? 'Yes' : 'No'
      return {
        id: p.id,
        publisher:
          p['Sub_Publishers']?.trim() ||
          p['Network_Publishers'] ||
          'Unknown',
        reach: parseFloat((p['Reach'] || '0').toString().replace(/,/g, '')) || 0,
        regions: pubRegions,
        click: toYesNo(p['Click_to_Activate']),
        minmax: toYesNo(p['Minimum/Maximum_Spend']),
        newCustomer: toYesNo(p['New_Customers']),
        firstTime: toYesNo(p['First_Time_Offer']),
        budgets: toYesNo(p['Budgets']),
        refunds: toYesNo(p['Refunds']),
        fixed: toYesNo(p['Fixed_CPA'])
      }
    })
    .filter((p) => {
      const f = targetFilters
      if (f.regions.length && !f.regions.some((r) => p.regions.includes(r))) return false
      if (f.click && p.click !== f.click) return false
      if (f.minmax && p.minmax !== f.minmax) return false
      if (f.newCustomer && p.newCustomer !== f.newCustomer) return false
      if (f.firstTime && p.firstTime !== f.firstTime) return false
      if (f.budgets && p.budgets !== f.budgets) return false
      if (f.refunds && p.refunds !== f.refunds) return false
      if (f.fixed && p.fixed !== f.fixed) return false
      return true
    })

  const COLORS = ['#5ec2f7', '#a6e3e9', '#f9a826', '#82ca9d', '#8884d8']

  return (
    <div className="content">
      <h1 style={{ color: 'var(--accent)' }}>Dashboard</h1>
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
        <div className="card">
          <p>Total retailers: {totalRetailers}</p>
          <p>Average cashback: {avgCashback.toFixed(2)}</p>
          <p>Number of stores: {totalStores.toLocaleString()}</p>
        </div>
      )}
      {view === 'publishers' && (
        <div className="card">
          <h3>Publisher Targeting</h3>
          <div className="filter-group">
            <MultiSelect
              label="Regions"
              options={regionOptions}
              value={targetFilters.regions}
              onChange={(val) =>
                setTargetFilters({ ...targetFilters, regions: val })
              }
            />
            <label>
              Click To Activate:
              <select
                value={targetFilters.click}
                onChange={(e) =>
                  setTargetFilters({ ...targetFilters, click: e.target.value })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              Minimum/Maximum Spend:
              <select
                value={targetFilters.minmax}
                onChange={(e) =>
                  setTargetFilters({ ...targetFilters, minmax: e.target.value })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              New Customer Offer:
              <select
                value={targetFilters.newCustomer}
                onChange={(e) =>
                  setTargetFilters({
                    ...targetFilters,
                    newCustomer: e.target.value,
                  })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              First Time Offer:
              <select
                value={targetFilters.firstTime}
                onChange={(e) =>
                  setTargetFilters({
                    ...targetFilters,
                    firstTime: e.target.value,
                  })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              Budgets:
              <select
                value={targetFilters.budgets}
                onChange={(e) =>
                  setTargetFilters({
                    ...targetFilters,
                    budgets: e.target.value,
                  })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              Refunds:
              <select
                value={targetFilters.refunds}
                onChange={(e) =>
                  setTargetFilters({
                    ...targetFilters,
                    refunds: e.target.value,
                  })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>
              Fixed Amount Offer:
              <select
                value={targetFilters.fixed}
                onChange={(e) =>
                  setTargetFilters({ ...targetFilters, fixed: e.target.value })
                }
              >
                <option value="">Any</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
          </div>
          <p>
            Total reach:{' '}
            {filteredPublishers
              .reduce((sum, p) => sum + p.reach, 0)
              .toLocaleString()}
          </p>
          <ul>
            {filteredPublishers.map((p) => (
              <li key={p.id}>
                {p.publisher} - {p.reach.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'merchants' && (
        <div className="card">
          <h3>Retailers by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <XAxis dataKey="region" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="count" fill="#5ec2f7" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Retailers by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <XAxis dataKey="status" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="count" fill="#a6e3e9" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Payment Methods</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={paymentData} dataKey="count" nameKey="method" outerRadius={100} label>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {paymentData.map((p) => (
                <li key={p.method}>{p.method}: {p.count}</li>
              ))}
            </ul>
          </div>

          <h3>Retailers by Sales Rep</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesRepData}>
              <XAxis dataKey="rep" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Merchants by Vertical</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={verticalData}>
              <XAxis dataKey="vertical" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Always On vs Tactical</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={tacticData} dataKey="count" nameKey="type" outerRadius={100} label>
                {tacticData.map((entry, index) => (
                  <Cell key={`cell-tactic-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>

          <h3>Retailers by Lead Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadSourceData}>
              <XAxis dataKey="source" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="count" fill="#f9a826" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Top Merchants</h3>
          <ol>
            {topMerchants.map((m) => (
              <li key={m.name}>
                {m.name} - £{m.revenue.toFixed(2)}m
              </li>
            ))}
          </ol>
        </div>
      )}

      {view === 'publishers' && (
        <div className="card">
          <h3>Reach by Network Publisher</h3>
          <ResponsiveContainer width="95%" height={250}>
            <BarChart data={reachData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
              <XAxis dataKey="publisher" stroke="#ccc" tickMargin={10} />
              <YAxis stroke="#ccc" tickMargin={10} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="tooltip">
                        <strong>{d.publisher}</strong>: {d.reach.toLocaleString()}
                        {d.subs.length > 0 && (
                          <ul style={{ paddingLeft: '1rem' }}>
                            {d.subs.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="reach" fill="#5ec2f7" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Reach by Sub-Publisher</h3>
          <ResponsiveContainer width="95%" height={250}>
            <BarChart data={subReachData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
              <XAxis dataKey="sub" stroke="#ccc" tickMargin={10} />
              <YAxis stroke="#ccc" tickMargin={10} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="reach" fill="#a6e3e9" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Reach by Region</h3>
          <ResponsiveContainer width="95%" height={250}>
            <BarChart data={regionReachData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
              <XAxis dataKey="region" stroke="#ccc" tickMargin={10} />
              <YAxis stroke="#ccc" tickMargin={10} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="reach" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Reach Distribution</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reachData}
                    dataKey="reach"
                    nameKey="publisher"
                    outerRadius={100}
                  >
                    {reachData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', whiteSpace: 'nowrap' }}>
              {reachData.map((d) => (
                <li key={d.publisher} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.publisher}: {d.reach.toLocaleString()} ({((d.reach / totalReach) * 100).toFixed(1)}%)
                </li>
              ))}
            </ol>
          </div>


        </div>
      )}
    </div>
  )
}

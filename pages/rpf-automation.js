import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TRC_LOGO =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMjAgMzIiPgogIDxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMzIiIGZpbGw9IndoaXRlIi8+CiAgPHRleHQgeD0iMCIgeT0iMjIiIGZvbnQtZmFtaWx5PSJJbnRlciwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzE2MzE2NSIgZm9udC13ZWlnaHQ9IjYwMCI+VFJDPC90ZXh0Pgo8L3N2Zz4K'

export default function RPFAutomation() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [tableRows, setTableRows] = useState([])
  const defaultColumns = [
    'reward_programme',
    'commission',
    'offer_period',
    'mids_descriptors',
    'comments'
  ]
  const [form, setForm] = useState({
    rpf_name: '',
    go_live_date: '',
    summary: '',
    current_offers: '',
    live_reward_programmes: '',
    included_mids: '',
    excluded_mids: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAM, setIsAM] = useState(false)
  const [newMode, setNewMode] = useState(false)

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : ''
    if (role && role.toLowerCase().includes('account')) setIsAM(true)
  }, [])

  async function handleSearch() {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    setLoading(true)
    let query = supabase.from('rpf_forms').select('*')
    if (search.trim()) {
      const id = parseInt(search.trim())
      if (!isNaN(id)) {
        query = query.or(`id.eq.${id},rpf_name.ilike.%${search.trim()}%`)
      } else {
        query = query.ilike('rpf_name', `%${search.trim()}%`)
      }
    }
    const { data, error } = await query
    if (error) {
      console.error('search error', error)
      setResults([])
    } else {
      setResults(data)
    }
    setLoading(false)
  }

  function selectRpf(r) {
    setSelected(r)
    setNewMode(false)
    setForm({
      rpf_name: r.rpf_name || '',
      go_live_date: r.go_live_date || '',
      summary: r.summary || '',
      current_offers: r.current_offers || '',
      live_reward_programmes: r.live_reward_programmes || '',
      included_mids: r.included_mids || '',
      excluded_mids: r.excluded_mids || ''
    })
    setTableRows(Array.isArray(r.table_data) ? r.table_data : [])
  }

  function updateForm(field, value) {
    setForm({ ...form, [field]: value })
  }

  function updateCell(i, key, value) {
    const rows = [...tableRows]
    rows[i] = { ...rows[i], [key]: value }
    setTableRows(rows)
  }

  function addRow() {
    const cols = tableRows[0] ? Object.keys(tableRows[0]) : defaultColumns
    const row = {}
    cols.forEach(c => {
      row[c] = ''
    })
    setTableRows([...tableRows, row])
  }

  function newRpf() {
    setSelected({})
    setNewMode(true)
    setForm({
      rpf_name: '',
      go_live_date: '',
      summary: '',
      current_offers: '',
      live_reward_programmes: '',
      included_mids: '',
      excluded_mids: ''
    })
    setTableRows([{ ...defaultColumns.reduce((a,c)=>{a[c]='';return a}, {}) }])
  }

  async function saveRpf() {
    if (!supabase) return
    if (!form.rpf_name) { alert('RPF name required'); return }
    const email =
      typeof window !== 'undefined' ? localStorage.getItem('email') || '' : ''
    const base = {
      ...form,
      table_data: tableRows,
      updated_at: new Date().toISOString(),
      last_updated_by: email
    }
    let res
    if (newMode) {
      res = await supabase.from('rpf_forms').insert([{ ...base, version: 1 }]).select()
    } else if (selected) {
      res = await supabase
        .from('rpf_forms')
        .update({ ...base, version: (selected.version || 1) + 1 })
        .eq('id', selected.id)
        .select()
    }
    if (res && res.error) {
      console.error('save error', res.error)
      alert('Failed to save')
    } else if (res && res.data && res.data[0]) {
      setSelected(res.data[0])
      setNewMode(false)
      alert('Saved')
      handleSearch()
    }
  }

  function downloadPdf() {
    try {
      const doc = new jsPDF()
      doc.addImage(TRC_LOGO, 'SVG', 10, 10, 30, 12)
    let y = 26
    const today = new Date().toLocaleDateString()
    doc.setFontSize(16)
    doc.text(`${form.rpf_name} Reward Programme`, 50, 14)
    doc.setFontSize(12)
    doc.text(`Reward Programme Form dated ${today}`, 50, 20)
    doc.text(`Go Live Date: ${form.go_live_date || ''}`, 50, 26)
    const intro =
      'This Reward Programme Form is subject to the terms and conditions of the Master General Service Agreement (MGSA) available at https://therewardcollection.com/master-general-service-agreement/ and the terms and conditions of the Insertion Order entered into by and between The Reward Collection Ltd and the Retail Partner (together, the "Agreement"), effective as of the Effective Date. This Reward Programme Form is subject to change from time to time. The company will issue the Retail Partner with a new Reward Programme Form each time any changes are made. The revised Reward Programme Form shall form part of the Agreement between the parties.'
    const introLines = doc.splitTextToSize(intro, 180)
    doc.text(introLines, 10, y)
    y += introLines.length * 6 + 4
    const info = [
      ['Summary', form.summary],
      ['Current Offer(s)', form.current_offers],
      ['Live Reward Programmes', form.live_reward_programmes],
      ['Included MIDs/Descriptors', form.included_mids],
      ['Excluded MIDs/Descriptors', form.excluded_mids]
    ]
    info.forEach(([label, text]) => {
      doc.text(`${label}:`, 10, y)
      const lines = doc.splitTextToSize(text || '', 180)
      doc.text(lines, 10, y + 6)
      y += lines.length * 6 + 10
    })
    if (tableRows.length) {
      const headers = [
        [
          'Reward Programme',
          'Commission',
          'Offer Period',
          'MIDs / Descriptors',
          'Comments'
        ]
      ]
      const data = tableRows.map((r) => [
        r.reward_programme || '',
        r.commission || '',
        r.offer_period || '',
        r.mids_descriptors || '',
        r.comments || ''
      ])
      autoTable(doc, {
        head: headers,
        body: data,
        startY: y,
        headStyles: { fillColor: [22, 49, 101], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
    }
      doc.save(`${form.rpf_name || 'rpf'}.pdf`)
    } catch (err) {
      console.error('PDF error', err)
      alert('Failed to generate PDF')
    }
  }

  useEffect(() => { handleSearch() }, [])

  return (
    <div className="content">
      <h1 style={{ color: 'var(--accent)' }}>RPF Automation</h1>
      {!supabase && <p>Supabase not configured</p>}
      {supabase && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID"
              style={{ flex: 1, padding: 8, borderRadius: 8 }}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          <button onClick={newRpf} style={{ marginBottom: '1rem' }}>
            Create New RPF
          </button>
          {loading && <p>Loading...</p>}
          {results.map((r) => (
            <div
              key={r.id}
              style={{ cursor: 'pointer', padding: '4px 0' }}
              onClick={() => selectRpf(r)}
            >
              {r.id} - {r.rpf_name}
            </div>
          ))}
          {selected && (
            <div className="card rpf-form" style={{ marginTop: '1rem' }}>
              <h2>{form.rpf_name}</h2>
              <div>
                <label>
                  RPF Name:
                  <input
                    type="text"
                    value={form.rpf_name}
                    onChange={(e) => updateForm('rpf_name', e.target.value)}
                    disabled={!isAM}
                    style={{ marginLeft: 8 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Go Live Date:
                  <input
                    type="date"
                    value={form.go_live_date || ''}
                    onChange={(e) => updateForm('go_live_date', e.target.value)}
                    disabled={!isAM}
                    style={{ marginLeft: 8 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Summary:
                  <textarea
                    value={form.summary}
                    onChange={(e) => updateForm('summary', e.target.value)}
                    disabled={!isAM}
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Current Offers:
                  <textarea
                    value={form.current_offers}
                    onChange={(e) => updateForm('current_offers', e.target.value)}
                    disabled={!isAM}
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Live Reward Programmes:
                  <textarea
                    value={form.live_reward_programmes}
                    onChange={(e) => updateForm('live_reward_programmes', e.target.value)}
                    disabled={!isAM}
                    rows={2}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Included MIDs:
                  <input
                    type="text"
                    value={form.included_mids}
                    onChange={(e) => updateForm('included_mids', e.target.value)}
                    disabled={!isAM}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Excluded MIDs:
                  <input
                    type="text"
                    value={form.excluded_mids}
                    onChange={(e) => updateForm('excluded_mids', e.target.value)}
                    disabled={!isAM}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
              {tableRows.length > 0 && (
                <table className="rpf-table" style={{ marginTop: '1rem', width: '100%' }}>
                  <thead>
                    <tr>
                      {Object.keys(tableRows[0]).map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k}>
                            {isAM ? (
                              <input
                                value={v}
                                onChange={(e) => updateCell(i, k, e.target.value)}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              v
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={addRow} style={{ marginTop: '0.5rem' }}>
                Add Row
              </button>
              <div style={{ marginTop: '1rem' }}>
                {isAM && (
                  <button onClick={saveRpf}>Save</button>
                )}
                <button onClick={downloadPdf} style={{ marginLeft: '0.5rem' }}>
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

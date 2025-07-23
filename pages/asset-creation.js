import { useState } from 'react'

const SIZES = [
  { label: '300x250', w: 300, h: 250 },
  { label: '728x90', w: 728, h: 90 },
  { label: '160x600', w: 160, h: 600 },
  { label: '600x600', w: 600, h: 600 }
]

async function resizeImage(file, width, height) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function AssetCreation() {
  const [singleFile, setSingleFile] = useState(null)
  const [singleSize, setSingleSize] = useState(SIZES[0].label)
  const [singleUrl, setSingleUrl] = useState('')

  const [batchFiles, setBatchFiles] = useState([])
  const [batchSize, setBatchSize] = useState(SIZES[0].label)
  const [batchResults, setBatchResults] = useState([])

  const handleSingle = async () => {
    if (!singleFile) return
    const size = SIZES.find((s) => s.label === singleSize)
    const blob = await resizeImage(singleFile, size.w, size.h)
    setSingleUrl(URL.createObjectURL(blob))
  }

  const handleBatch = async () => {
    if (batchFiles.length === 0) return
    const size = SIZES.find((s) => s.label === batchSize)
    const results = []
    for (const file of batchFiles) {
      const blob = await resizeImage(file, size.w, size.h)
      results.push({ name: file.name, url: URL.createObjectURL(blob) })
    }
    setBatchResults(results)
  }

  const downloadAll = () => {
    batchResults.forEach((r) => {
      const a = document.createElement('a')
      a.href = r.url
      a.download = r.name
      a.click()
    })
  }

  return (
    <div className="content">
      <h1 style={{ color: 'var(--accent)' }}>Asset Creation</h1>

      <div className="card">
        <h2>Single Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSingleFile(e.target.files[0])}
        />
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            Size:
            <select
              value={singleSize}
              onChange={(e) => setSingleSize(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {SIZES.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleSingle} style={{ marginLeft: '1rem' }}>
            Resize
          </button>
        </div>
        {singleUrl && (
          <div style={{ marginTop: '1rem' }}>
            <img src={singleUrl} alt="result" style={{ maxWidth: '100%' }} />
            <br />
            <a href={singleUrl} download="resized.jpg">
              Download
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Batch Upload</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setBatchFiles(Array.from(e.target.files))}
        />
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            Size:
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {SIZES.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleBatch} style={{ marginLeft: '1rem' }}>
            Resize All
          </button>
          {batchResults.length > 0 && (
            <button onClick={downloadAll} style={{ marginLeft: '1rem' }}>
              Download All
            </button>
          )}
        </div>
        {batchResults.length > 0 && (
          <ul style={{ marginTop: '1rem' }}>
            {batchResults.map((r, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {r.name} -{' '}
                <a href={r.url} download={r.name}>
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

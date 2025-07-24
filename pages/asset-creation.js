import { useState } from 'react'

const SIZES = [
  { label: '360x360 - Fidel', w: 360, h: 360 },
  { label: '260x200 - Logo', w: 260, h: 200 },
  { label: '450x300 - Small Banner', w: 450, h: 300 },
  { label: '2100x1400 - Large Banner', w: 2100, h: 1400 },
  { label: '1125x960 - Lifestyle image', w: 1125, h: 960 }
]

async function resizeImage(file, width, height) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
  })
}

export default function AssetCreation() {
  const [siteUrl, setSiteUrl] = useState('')
  const [retrieved, setRetrieved] = useState([])
  const [retrievalSize, setRetrievalSize] = useState(SIZES[0].label)

  const fetchImages = async () => {
    if (!siteUrl) return
    try {
      const res = await fetch(`/api/fetch-images?url=${encodeURIComponent(siteUrl)}`)
      const data = await res.json()
      setRetrieved(data.images || [])
    } catch (e) {
      console.error(e)
    }
  }

  const downloadRetrieved = async () => {
    const size = SIZES.find((s) => s.label === retrievalSize)
    for (const [i, url] of retrieved.entries()) {
      try {
        const resp = await fetch(url)
        const blob = await resp.blob()
        const resized = await resizeImage(blob, size.w, size.h)
        const dl = document.createElement('a')
        dl.href = URL.createObjectURL(resized)
        dl.download = `image_${i + 1}.jpg`
        dl.click()
      } catch (e) {
        console.error('download failed', e)
      }
    }
  }
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
        <h2>Asset Retrieval</h2>
        <input
          type="text"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://example.com"
          style={{ width: '60%', marginRight: '1rem' }}
        />
        <button onClick={fetchImages}>Fetch Images</button>
        {retrieved.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <label>
              Size:
              <select
                value={retrievalSize}
                onChange={(e) => setRetrievalSize(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                {SIZES.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={downloadRetrieved} style={{ marginLeft: '1rem' }}>
              Download Resized Images
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '1rem' }}>
              {retrieved.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`retrieved-${i}`}
                  style={{ width: 100, height: 'auto', marginRight: '0.5rem' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Single Image</h2>
        <div
          className="drop-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) {
              setSingleFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <p>Drag & drop an image here or click to select</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSingleFile(e.target.files[0])}
            style={{ display: 'none' }}
            id="single-input"
          />
          <label htmlFor="single-input" className="upload-btn">Browse</label>
        </div>
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
        <div
          className="drop-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            if (files.length) setBatchFiles(files);
          }}
        >
          <p>Drag & drop images here or click to select</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setBatchFiles(Array.from(e.target.files))}
            style={{ display: 'none' }}
            id="batch-input"
          />
          <label htmlFor="batch-input" className="upload-btn">Browse</label>
        </div>
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

import { useState } from 'react'

const SIZES = [
  { label: '500x500', w: 500, h: 500 },
  { label: '728x90', w: 728, h: 90 },
  { label: '320x50', w: 320, h: 50 },
  { label: '300x250', w: 300, h: 250 },
  { label: '160x600', w: 160, h: 600 },
  { label: '1200x628', w: 1200, h: 628 },
  { label: '600x200', w: 600, h: 200 },
  { label: '128x128', w: 128, h: 128 },
  { label: '32x32', w: 32, h: 32 }
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

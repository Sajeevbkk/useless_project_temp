import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [backendMessage, setBackendMessage] = useState('')
  const [items, setItems] = useState([])
  const [itemName, setItemName] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const checkBackend = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setBackendStatus('connected')
        // Also fetch message and items
        const msgRes = await fetch('/api/message')
        if (msgRes.ok) {
          const msgData = await msgRes.json()
          setBackendMessage(msgData.message)
        }
        fetchItems()
      } else {
        setBackendStatus('error')
      }
    } catch {
      setBackendStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (err) {
      console.error('Failed to fetch items:', err)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!itemName.trim()) return

    try {
      const newItem = {
        id: Date.now(),
        name: itemName,
        description: itemDesc || 'No description provided',
      }
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })
      if (res.ok) {
        setItemName('')
        setItemDesc('')
        fetchItems()
      }
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  useEffect(() => {
    checkBackend()
  }, [])

  return (
    <div className="container">
      <header className="header">
        <div className="badge-wrapper">
          <span className="tech-badge react">⚛ React (Frontend)</span>
          <span className="plus">+</span>
          <span className="tech-badge fastapi">⚡ FastAPI (Backend)</span>
        </div>
        <h1>Fullstack Base Application</h1>
        <p className="subtitle">
          Modern website architecture orchestrated with Node.js scripts
        </p>
      </header>

      <div className="status-banner">
        <div className="status-item">
          <span className="indicator live"></span>
          <div>
            <strong>Frontend:</strong> React (Vite) on port <code>5173</code>
          </div>
        </div>
        <div className="status-item">
          <span
            className={`indicator ${
              backendStatus === 'connected'
                ? 'live'
                : backendStatus === 'checking'
                ? 'checking'
                : 'offline'
            }`}
          ></span>
          <div>
            <strong>Backend:</strong> FastAPI on port <code>8000</code> -{' '}
            <span className="status-text">{backendStatus.toUpperCase()}</span>
          </div>
        </div>
        <button
          className="btn-refresh"
          onClick={checkBackend}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Check Connection'}
        </button>
      </div>

      <main className="main-content">
        <section className="card">
          <h2>📡 Backend Communication</h2>
          {backendStatus === 'connected' ? (
            <div className="api-preview">
              <p>
                <strong>Server Greeting:</strong> &ldquo;{backendMessage}&rdquo;
              </p>
              <div className="api-links">
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  Swagger OpenAPI Docs ↗
                </a>
                <a
                  href="http://127.0.0.1:8000/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  Health Endpoint ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="offline-warning">
              <p>FastAPI backend is currently offline or unreachable.</p>
              <p className="hint">
                Start the backend using <code>npm run dev:backend</code> or run both with <code>npm run dev</code>.
              </p>
            </div>
          )}
        </section>

        <section className="card">
          <h2>📦 Live Data CRUD Test</h2>
          <form onSubmit={handleAddItem} className="item-form">
            <input
              type="text"
              placeholder="Item name (e.g. User Profile)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description (e.g. Auth module)"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
            />
            <button type="submit" disabled={backendStatus !== 'connected'}>
              Add Item
            </button>
          </form>

          <div className="items-list">
            <h3>Items in Backend Memory ({items.length})</h3>
            {items.length === 0 ? (
              <p className="empty-msg">No items found.</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id} className="item-card">
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    <small>ID: {item.id}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card info-card">
          <h2>📁 Project Architecture</h2>
          <div className="tree-structure">
            <pre>
{`├── backend/
│   ├── .venv/               # Python virtual environment
│   ├── main.py              # FastAPI app with CORS & endpoints
│   └── requirements.txt     # fastapi, uvicorn, pydantic
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React components
│   │   ├── App.css
│   │   └── main.jsx
│   ├── vite.config.js       # Vite dev server + /api proxy
│   └── package.json         # React dependencies & scripts
├── package.json             # Root orchestrator (concurrently dev scripts)
└── .gitignore               # Configured for Node & Python`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

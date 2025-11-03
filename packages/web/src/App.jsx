import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TaskEditor from './pages/TaskEditor'
import TaskRunner from './pages/TaskRunner'
import ToolsExplorer from './pages/ToolsExplorer'
import FlowBuilder from './pages/FlowBuilder'
import RunDetail from './pages/RunDetail'
import useStore from './store'
import './App.css'

export default function App() {
  const { logs, clearLogs } = useStore()
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001`)

    ws.onopen = () => setWsConnected(true)
    ws.onclose = () => setWsConnected(false)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log('WebSocket message:', data)
    }

    return () => ws.close()
  }, [])

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>📊 Sequential Ecosystem Admin</h1>
            <span className={`status ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? '🟢 Live' : '⚪ Offline'}
            </span>
          </div>
          <ul className="nav-links">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/tasks">Tasks</Link></li>
            <li><Link to="/runner">Task Runner</Link></li>
            <li><Link to="/tools">Tools</Link></li>
            <li><Link to="/flow-builder">Flow Builder</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks/:taskId" element={<TaskEditor />} />
            <Route path="/runner/:taskId" element={<TaskRunner />} />
            <Route path="/tools" element={<ToolsExplorer />} />
            <Route path="/flow-builder/:taskId" element={<FlowBuilder />} />
            <Route path="/runs/:taskId/:runId" element={<RunDetail />} />
            <Route path="/tasks" element={<TasksList />} />
          </Routes>
        </main>

        <aside className="sidebar-logs">
          <div className="logs-header">
            <h3>Live Logs</h3>
            <button onClick={clearLogs} className="btn-small">Clear</button>
          </div>
          <div className="logs-container">
            {logs.map((log, i) => (
              <div key={i} className="log-line">{log}</div>
            ))}
          </div>
        </aside>
      </div>
    </Router>
  )
}

function TasksList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading tasks...</div>

  return (
    <div className="page">
      <h2>All Tasks</h2>
      <div className="task-grid">
        {tasks.map(task => (
          <div key={task.id} className="task-card">
            <h3>{task.name || task.id}</h3>
            <p>{task.description}</p>
            <div className="card-actions">
              <Link to={`/tasks/${task.id}`} className="btn">Edit</Link>
              <Link to={`/runner/${task.id}`} className="btn btn-primary">Run</Link>
              <Link to={`/flow-builder/${task.id}`} className="btn">Graph</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

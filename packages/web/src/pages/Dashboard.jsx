import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [runs, setRuns] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/runs').then(r => r.json()),
      fetch('http://localhost:3001/api/tasks').then(r => r.json())
    ]).then(([runsData, tasksData]) => {
      setRuns(runsData)
      setTasks(tasksData)
      setLoading(false)
    })

    const interval = setInterval(() => {
      fetch('http://localhost:3001/api/runs?limit=50').then(r => r.json()).then(setRuns)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredRuns = runs.filter(run => {
    const matchesStatus = filter === 'all' || run.status === filter
    const matchesSearch = run.taskId?.includes(search) || run.id?.includes(search)
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: runs.length,
    completed: runs.filter(r => r.status === 'completed').length,
    failed: runs.filter(r => r.status === 'failed').length,
    pending: runs.filter(r => r.status === 'pending' || r.status === 'in_progress').length
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="page dashboard">
      <h2>Task Runs Observability</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Runs</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card error">
          <div className="stat-value">{stats.failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Running</div>
        </div>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search runs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="in_progress">Running</option>
        </select>
      </div>

      <table className="runs-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Run ID</th>
            <th>Status</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRuns.map(run => {
            const duration = run.completedAt ?
              ((new Date(run.completedAt) - new Date(run.startedAt)) / 1000).toFixed(1) + 's' :
              '-'
            return (
              <tr key={run.id} className={`status-${run.status}`}>
                <td><strong>{run.taskId}</strong></td>
                <td><code>{run.id.substring(0, 8)}</code></td>
                <td><span className={`badge ${run.status}`}>{run.status}</span></td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
                <td>{duration}</td>
                <td>
                  <Link to={`/runs/${run.taskId}/${run.id}`} className="btn-small">View</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

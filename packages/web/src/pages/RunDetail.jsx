import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import '../styles/RunDetail.css'

export default function RunDetail() {
  const { taskId, runId } = useParams()
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:3001/api/tasks/${taskId}/runs/${runId}`)
      .then(r => r.json())
      .then(setRun)
      .finally(() => setLoading(false))
  }, [taskId, runId])

  if (loading) return <div className="loading">Loading run details...</div>
  if (!run) return <div className="error">Run not found</div>

  const duration = run.completedAt ?
    ((new Date(run.completedAt) - new Date(run.startedAt)) / 1000).toFixed(2) + 's' :
    'Still running'

  return (
    <div className="page run-detail">
      <div className="header">
        <div>
          <h2>Run Details</h2>
          <p className="breadcrumb">
            <Link to="/">Dashboard</Link> → Task: <strong>{taskId}</strong>
          </p>
        </div>
        <span className={`badge large status-${run.status}`}>{run.status}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Run Information</h3>
          <table className="info-table">
            <tbody>
              <tr>
                <td>Run ID</td>
                <td><code>{run.id}</code></td>
              </tr>
              <tr>
                <td>Task</td>
                <td><strong>{run.taskId}</strong></td>
              </tr>
              <tr>
                <td>Status</td>
                <td><span className={`badge ${run.status}`}>{run.status}</span></td>
              </tr>
              <tr>
                <td>Started</td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Completed</td>
                <td>
                  {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Pending'}
                </td>
              </tr>
              <tr>
                <td>Duration</td>
                <td>{duration}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="detail-card">
          <h3>Input Parameters</h3>
          <pre className="json-block">{JSON.stringify(run.input, null, 2)}</pre>
        </div>

        {run.output && (
          <div className="detail-card">
            <h3>Output Result</h3>
            <pre className="json-block">{JSON.stringify(run.output, null, 2)}</pre>
          </div>
        )}

        {run.error && (
          <div className="detail-card error">
            <h3>Error</h3>
            <pre className="error-block">{run.error}</pre>
          </div>
        )}
      </div>

      <div className="actions">
        <Link to={`/runner/${taskId}`} className="btn btn-primary">
          Run Again
        </Link>
        <Link to={`/tasks/${taskId}`} className="btn">
          Edit Task
        </Link>
        <Link to="/" className="btn">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

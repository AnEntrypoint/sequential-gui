import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useStore from '../store'
import '../styles/TaskRunner.css'

export default function TaskRunner() {
  const { taskId } = useParams()
  const { addLog } = useStore()
  const [input, setInput] = useState('{}')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [taskConfig, setTaskConfig] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:3001/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(setTaskConfig)
  }, [taskId])

  const handleRun = async () => {
    setRunning(true)
    setLogs([])

    try {
      const parsedInput = JSON.parse(input)

      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: parsedInput })
      })

      const result = await response.json()
      setLastResult(result)
      setLogs(prev => [...prev, `✅ Task completed successfully`])
      addLog(`Task ${taskId} completed`)
    } catch (err) {
      setLogs(prev => [...prev, `❌ Error: ${err.message}`])
      addLog(`Task ${taskId} failed: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    try {
      JSON.parse(e.target.value)
    } catch (err) {
      setLogs([`⚠️ Invalid JSON: ${err.message}`])
    }
  }

  return (
    <div className="page task-runner">
      <h2>Debug Task Runner - {taskId}</h2>

      <div className="runner-layout">
        <div className="runner-input">
          <h3>Task Input</h3>
          {taskConfig?.config?.inputs && (
            <div className="input-schema">
              <strong>Expected inputs:</strong>
              <ul>
                {taskConfig.config.inputs.map((inp, i) => (
                  <li key={i}>
                    <code>{inp.name}</code>: {inp.type} - {inp.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Enter JSON input..."
            className="input-editor"
          />
          <button
            onClick={handleRun}
            disabled={running}
            className="btn btn-primary"
          >
            {running ? '⏳ Running...' : '▶️ Run Task'}
          </button>
        </div>

        <div className="runner-output">
          <div className="logs-panel">
            <h3>Execution Logs</h3>
            <div className="logs">
              {logs.length === 0 ? (
                <p className="empty">No logs yet. Run a task to see output.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="log-entry">{log}</div>
                ))
              )}
            </div>
          </div>

          {lastResult && (
            <div className="result-panel">
              <h3>Result</h3>
              <pre>{JSON.stringify(lastResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

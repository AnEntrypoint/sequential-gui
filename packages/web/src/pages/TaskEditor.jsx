import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useStore from '../store'
import '../styles/TaskEditor.css'

export default function TaskEditor() {
  const { taskId } = useParams()
  const { addLog } = useStore()
  const [activeTab, setActiveTab] = useState('code')
  const [code, setCode] = useState('')
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:3001/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(data => {
        setCode(data.code || '')
        setConfig(data.config || {})
        setLoading(false)
      })
  }, [taskId])

  const handleSaveCode = async () => {
    setSaving(true)
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/code`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      addLog(`Code saved for ${taskId}`)
    } catch (err) {
      addLog(`Failed to save code: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      addLog(`Config saved for ${taskId}`)
    } catch (err) {
      addLog(`Failed to save config: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading task...</div>

  return (
    <div className="page task-editor">
      <h2>Task Editor - {taskId}</h2>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          📝 Code
        </button>
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configuration
        </button>
      </div>

      <div className="editor-container">
        {activeTab === 'code' && (
          <div className="editor-panel">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-editor"
              placeholder="export async function taskName(input) {
  // Your task code here
}"
            />
            <button
              onClick={handleSaveCode}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Code'}
            </button>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="config-panel">
            <div className="form-group">
              <label>Task Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Inputs (JSON)</label>
              <textarea
                value={JSON.stringify(config.inputs || [], null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, inputs: JSON.parse(e.target.value) })
                  } catch (err) {}
                }}
                className="form-textarea"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

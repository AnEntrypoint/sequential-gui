import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useStore from '../store'
import StateMachineVisualizer from '../components/StateMachineVisualizer'
import '../styles/FlowBuilder.css'

export default function FlowBuilder() {
  const { taskId } = useParams()
  const { addLog } = useStore()
  const [graph, setGraph] = useState(null)
  const [states, setStates] = useState([])
  const [selectedState, setSelectedState] = useState(null)
  const [newStateName, setNewStateName] = useState('')
  const [saving, setSaving] = useState(false)
  const [draggedState, setDraggedState] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`http://localhost:3001/api/tasks/${taskId}`)
      .then(r => r.json())
      .then(data => {
        if (data.graph) {
          setGraph(data.graph)
          setStates(Object.keys(data.graph.states || {}))
        } else {
          setGraph({ id: taskId, initial: 'start', states: {} })
          setStates(['start'])
        }
      })
      .catch(err => addLog(`Failed to load task: ${err.message}`))
  }, [taskId, addLog])

  const validateStateName = (name) => {
    if (!name.trim()) return 'State name is required'
    if (states.includes(name)) return 'State already exists'
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return 'Invalid name (letters, numbers, underscore only)'
    return null
  }

  const handleAddState = () => {
    const error = validateStateName(newStateName)
    if (error) {
      setErrors({ add: error })
      return
    }

    setErrors({})
    const newGraph = { ...graph }
    newGraph.states = newGraph.states || {}
    newGraph.states[newStateName] = {
      description: '',
      onDone: '',
      onError: ''
    }
    setGraph(newGraph)
    setStates([...states, newStateName])
    setNewStateName('')
    addLog(`State added: ${newStateName}`)
  }

  const handleDeleteState = (stateName) => {
    const newGraph = { ...graph }
    delete newGraph.states[stateName]
    const newStates = states.filter(s => s !== stateName)
    setGraph(newGraph)
    setStates(newStates)
    if (selectedState === stateName) setSelectedState(newStates[0] || null)
    addLog(`State deleted: ${stateName}`)
  }

  const handleStateChange = (stateName, field, value) => {
    const newGraph = { ...graph }
    newGraph.states[stateName] = { ...newGraph.states[stateName], [field]: value }
    setGraph(newGraph)
  }

  const handleDragStart = (stateName) => {
    setDraggedState(stateName)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (targetState) => {
    if (draggedState && draggedState !== targetState) {
      const newStates = states.filter(s => s !== draggedState)
      const idx = newStates.indexOf(targetState)
      newStates.splice(idx, 0, draggedState)
      setStates(newStates)
    }
    setDraggedState(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/graph`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph)
      })
      addLog(`✓ State graph saved for ${taskId}`)
    } catch (err) {
      addLog(`✗ Failed to save graph: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!graph) return <div className="loading">Loading flow...</div>

  return (
    <div className="page flow-builder">
      <h2>⚙️ Flow Builder</h2>

      <div className="builder-layout">
        <div className="states-panel">
          <h3>States ({states.length})</h3>

          <div className="add-state">
            <input
              type="text"
              value={newStateName}
              onChange={(e) => {
                setNewStateName(e.target.value)
                setErrors({})
              }}
              placeholder="State name..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddState()}
              className={`input-field ${errors.add ? 'error' : ''}`}
            />
            {errors.add && <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginTop: '4px' }}>{errors.add}</div>}
            <button onClick={handleAddState} className="btn btn-small">+ Add</button>
          </div>

          <div className="states-list">
            {states.map((state, idx) => (
              <div
                key={state}
                draggable
                onDragStart={() => handleDragStart(state)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(state)}
                className={`state-item ${selectedState === state ? 'active' : ''} ${state === graph.initial ? 'initial' : ''} ${draggedState === state ? 'dragging' : ''}`}
                onClick={() => setSelectedState(state)}
                style={{ cursor: draggedState === state ? 'grabbing' : 'grab' }}
              >
                <div className="state-label">
                  {state === graph.initial && '▶ '}
                  {state}
                  {draggedState === state && ' ⋮'}
                </div>
                {state !== graph.initial && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteState(state)
                    }}
                    className="btn-delete"
                    title="Delete state"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="state-editor">
          {selectedState ? (
            <div>
              <h3>Edit: <span style={{ color: 'var(--primary)' }}>{selectedState}</span></h3>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={graph.states[selectedState]?.description || ''}
                  onChange={(e) => handleStateChange(selectedState, 'description', e.target.value)}
                  className="form-textarea"
                  placeholder="Describe what happens in this state..."
                />
              </div>

              <div className="form-group">
                <label>✓ On Success (onDone)</label>
                <select
                  value={graph.states[selectedState]?.onDone || ''}
                  onChange={(e) => handleStateChange(selectedState, 'onDone', e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Next state on success --</option>
                  {states.map(s => s !== selectedState && (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="_final">✓ Final State</option>
                </select>
              </div>

              <div className="form-group">
                <label>✗ On Error (onError)</label>
                <select
                  value={graph.states[selectedState]?.onError || ''}
                  onChange={(e) => handleStateChange(selectedState, 'onError', e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Next state on error --</option>
                  {states.map(s => s !== selectedState && (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="_final">✗ Final State</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={graph.states[selectedState]?.type === 'final'}
                    onChange={(e) => {
                      handleStateChange(selectedState, 'type', e.target.checked ? 'final' : '')
                    }}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <span>Mark as Final State</span>
                </label>
              </div>
            </div>
          ) : (
            <p className="empty">👈 Select a state to configure</p>
          )}
        </div>

        <div className="preview-panel">
          <h3>📊 Visualization</h3>
          <div className="visualizer-container">
            <StateMachineVisualizer graph={graph} />
          </div>
          <h3>JSON Config</h3>
          <pre className="json-preview">{JSON.stringify(graph, null, 2)}</pre>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{
              marginTop: 'auto',
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Flow'}
          </button>
        </div>
      </div>
    </div>
  )
}

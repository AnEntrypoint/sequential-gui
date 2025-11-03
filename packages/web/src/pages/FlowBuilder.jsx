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
  }, [taskId])

  const handleAddState = () => {
    if (!newStateName.trim()) return

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
    setGraph(newGraph)
    setStates(states.filter(s => s !== stateName))
    setSelectedState(null)
    addLog(`State deleted: ${stateName}`)
  }

  const handleStateChange = (stateName, field, value) => {
    const newGraph = { ...graph }
    newGraph.states[stateName] = { ...newGraph.states[stateName], [field]: value }
    setGraph(newGraph)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/graph`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph)
      })
      addLog(`State graph saved for ${taskId}`)
    } catch (err) {
      addLog(`Failed to save graph: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!graph) return <div className="loading">Loading flow...</div>

  return (
    <div className="page flow-builder">
      <h2>Explicit xstate Flow Builder - {taskId}</h2>

      <div className="builder-layout">
        <div className="states-panel">
          <h3>States</h3>

          <div className="add-state">
            <input
              type="text"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              placeholder="New state name..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddState()}
              className="input-field"
            />
            <button onClick={handleAddState} className="btn btn-small">+ Add State</button>
          </div>

          <div className="states-list">
            {states.map(state => (
              <div
                key={state}
                className={`state-item ${selectedState === state ? 'active' : ''} ${state === graph.initial ? 'initial' : ''}`}
                onClick={() => setSelectedState(state)}
              >
                <div className="state-label">
                  {state === graph.initial && '▶ '}
                  {state}
                </div>
                {state !== graph.initial && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteState(state)
                    }}
                    className="btn-delete"
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
              <h3>Edit State: {selectedState}</h3>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={graph.states[selectedState]?.description || ''}
                  onChange={(e) => handleStateChange(selectedState, 'description', e.target.value)}
                  className="form-textarea"
                  placeholder="What does this state do?"
                />
              </div>

              <div className="form-group">
                <label>On Success (onDone)</label>
                <select
                  value={graph.states[selectedState]?.onDone || ''}
                  onChange={(e) => handleStateChange(selectedState, 'onDone', e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select next state --</option>
                  {states.map(s => s !== selectedState && (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="_final">Final State</option>
                </select>
              </div>

              <div className="form-group">
                <label>On Error (onError)</label>
                <select
                  value={graph.states[selectedState]?.onError || ''}
                  onChange={(e) => handleStateChange(selectedState, 'onError', e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select next state --</option>
                  {states.map(s => s !== selectedState && (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="_final">Final State</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={graph.states[selectedState]?.type === 'final'}
                    onChange={(e) => {
                      handleStateChange(selectedState, 'type', e.target.checked ? 'final' : '')
                    }}
                  />
                  Mark as Final State
                </label>
              </div>
            </div>
          ) : (
            <p className="empty">Select a state to edit its properties</p>
          )}
        </div>

        <div className="preview-panel">
          <h3>State Machine Visualization</h3>
          <div className="visualizer-container">
            <StateMachineVisualizer graph={graph} />
          </div>
          <h3>Graph JSON</h3>
          <pre className="json-preview">{JSON.stringify(graph, null, 2)}</pre>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Flow'}
          </button>
        </div>
      </div>
    </div>
  )
}

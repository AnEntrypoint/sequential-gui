import React, { useMemo } from 'react'
import '../styles/StateMachineVisualizer.css'

function getStatePositions(graph) {
  if (!graph || !graph.states) return {}

  const states = Object.keys(graph.states)
  const cols = Math.ceil(Math.sqrt(states.length))
  const positions = {}

  states.forEach((stateName, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols

    positions[stateName] = {
      x: 100 + col * 200,
      y: 100 + row * 150,
      width: 150,
      height: 60
    }
  })

  return positions
}

function renderTransitionArrows(graph, positions) {
  const arrows = []
  let id = 0

  Object.entries(graph.states || {}).forEach(([stateName, config]) => {
    const from = positions[stateName]
    if (!from) return

    if (config.onDone && config.onDone !== '_final') {
      const to = positions[config.onDone]
      if (to) {
        arrows.push(
          <g key={`arrow-${id++}`}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--primary)" />
              </marker>
            </defs>
            <line
              x1={from.x + from.width / 2}
              y1={from.y + from.height}
              x2={to.x + to.width / 2}
              y2={to.y}
              stroke="var(--primary)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="transition-arrow"
            />
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 - 5}
              className="transition-label"
              fill="var(--primary)"
              fontSize="12"
            >
              onDone
            </text>
          </g>
        )
      }
    }

    if (config.onError && config.onError !== '_final') {
      const to = positions[config.onError]
      if (to) {
        arrows.push(
          <g key={`arrow-${id++}`}>
            <line
              x1={from.x}
              y1={from.y + from.height / 2}
              x2={to.x + to.width}
              y2={to.y + to.height / 2}
              stroke="var(--error)"
              strokeWidth="2"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-error)"
              className="transition-arrow error"
            />
            <defs>
              <marker id="arrowhead-error" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--error)" />
              </marker>
            </defs>
            <text
              x={(from.x + to.x) / 2}
              y={(from.y + to.y) / 2 + 10}
              className="transition-label error"
              fill="var(--error)"
              fontSize="12"
            >
              onError
            </text>
          </g>
        )
      }
    }
  })

  return arrows
}

function renderStates(graph, positions) {
  return Object.entries(graph.states || {}).map(([stateName, config]) => {
    const pos = positions[stateName]
    if (!pos) return null

    const isInitial = stateName === graph.initial
    const isFinal = config.type === 'final'

    return (
      <g key={`state-${stateName}`}>
        {isFinal ? (
          <>
            <circle
              cx={pos.x + pos.width / 2}
              cy={pos.y + pos.height / 2}
              r="35"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))' }}
            />
            <circle
              cx={pos.x + pos.width / 2}
              cy={pos.y + pos.height / 2}
              r="25"
              fill="var(--surface)"
              stroke="var(--primary)"
              strokeWidth="2.5"
              style={{ animation: 'pulse-state 2s ease-in-out infinite' }}
            />
          </>
        ) : (
          <>
            {isInitial && (
              <defs>
                <style>{`
                  @keyframes pulse-state {
                    0%, 100% { filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.2)); }
                    50% { filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4)); }
                  }
                `}</style>
              </defs>
            )}
            <rect
              x={pos.x}
              y={pos.y}
              width={pos.width}
              height={pos.height}
              rx="10"
              fill="var(--surface)"
              stroke={isInitial ? 'var(--primary)' : 'var(--border)'}
              strokeWidth={isInitial ? 2.5 : 2}
              style={{
                filter: isInitial ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.2))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                transition: 'all 0.3s ease'
              }}
            />
          </>
        )}

        <text
          x={pos.x + pos.width / 2}
          y={pos.y + pos.height / 2 + 6}
          textAnchor="middle"
          className="state-label"
          fontSize="14"
          fontWeight="700"
          fill="var(--text)"
        >
          {stateName}
        </text>

        {isInitial && (
          <text
            x={pos.x + 12}
            y={pos.y + 20}
            fontSize="14"
            fill="var(--primary)"
            fontWeight="700"
          >
            ▶
          </text>
        )}
      </g>
    )
  }).filter(Boolean)
}

export default function StateMachineVisualizer({ graph }) {
  const positions = useMemo(() => getStatePositions(graph), [graph])
  const arrows = useMemo(() => renderTransitionArrows(graph, positions), [graph, positions])
  const states = useMemo(() => renderStates(graph, positions), [graph, positions])

  if (!graph || !graph.states || Object.keys(graph.states).length === 0) {
    return <div className="visualizer-placeholder">No states defined yet. Create a state to visualize the flow.</div>
  }

  const width = Math.max(800, Math.max(...Object.values(positions).map(p => p.x + p.width + 50)))
  const height = Math.max(500, Math.max(...Object.values(positions).map(p => p.y + p.height + 50)))

  return (
    <div className="state-machine-visualizer">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="graph-svg">
        {arrows}
        {states}
      </svg>
    </div>
  )
}

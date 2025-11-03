import React, { useMemo } from 'react'
import { createMachine } from 'xstate'
import { StateChart } from '@statecharts/xstate-viz'
import '../styles/StateMachineVisualizer.css'

function convertGraphToMachine(graph) {
  if (!graph || !graph.states) return null

  const stateDefinitions = {}
  for (const [stateName, stateConfig] of Object.entries(graph.states)) {
    const definition = { type: stateConfig.type === 'final' ? 'final' : 'normal' }

    const transitions = {}
    if (stateConfig.onDone) {
      transitions[stateConfig.onDone] = { target: stateConfig.onDone }
    }
    if (stateConfig.onError) {
      transitions[stateConfig.onError] = { target: stateConfig.onError }
    }

    if (Object.keys(transitions).length > 0) {
      definition.on = transitions
    }

    stateDefinitions[stateName] = definition
  }

  try {
    return createMachine({
      id: graph.id || 'flowMachine',
      initial: graph.initial || 'start',
      states: stateDefinitions
    })
  } catch (err) {
    console.error('Failed to create machine:', err)
    return null
  }
}

export default function StateMachineVisualizer({ graph }) {
  const machine = useMemo(() => convertGraphToMachine(graph), [graph])

  if (!machine) {
    return <div className="visualizer-placeholder">Invalid state machine configuration</div>
  }

  return (
    <div className="state-machine-visualizer">
      <StateChart machine={machine} />
    </div>
  )
}

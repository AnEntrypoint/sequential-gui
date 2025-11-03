import React, { useState, useEffect } from 'react'
import '../styles/ToolsExplorer.css'

export default function ToolsExplorer() {
  const [services, setServices] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/tools')
      .then(r => r.json())
      .then(data => {
        setServices(data.services || [])
        setLoading(false)
      })
  }, [])

  const handleSelectTool = async (tool) => {
    setSelectedTool(tool)
    const schemaData = await fetch(`http://localhost:3001/api/tools/${tool.id}/schema`)
      .then(r => r.json())
    setSchema(schemaData)
  }

  if (loading) return <div className="loading">Loading tools...</div>

  return (
    <div className="page tools-explorer">
      <h2>Tools & Services Explorer</h2>

      <div className="explorer-layout">
        <div className="tools-list">
          <h3>Available Services</h3>
          <div className="service-cards">
            {services.map(service => (
              <div
                key={service.id}
                className={`service-card ${selectedTool?.id === service.id ? 'active' : ''}`}
                onClick={() => handleSelectTool(service)}
              >
                <h4>{service.name}</h4>
                <p>{service.description}</p>
                <code>{service.id}</code>
              </div>
            ))}
          </div>
        </div>

        {selectedTool && schema && (
          <div className="schema-viewer">
            <h3>{selectedTool.name} Schema</h3>

            <div className="schema-section">
              <h4>Authentication</h4>
              <p><code>{schema.auth}</code></p>
            </div>

            <div className="schema-section">
              <h4>Available Methods</h4>
              <ul className="methods-list">
                {schema.methods.map((method, i) => (
                  <li key={i}>
                    <code className="method-name">{method}</code>
                  </li>
                ))}
              </ul>
            </div>

            <div className="code-example">
              <h4>Usage Example</h4>
              <pre>{`const result = await __callHostTool__('${selectedTool.id}', '${schema.methods[0]}', {
  // parameters here
})

console.log(result)`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

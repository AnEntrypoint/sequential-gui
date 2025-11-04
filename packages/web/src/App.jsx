import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Activity, Settings, Menu, X } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import TaskEditor from './pages/TaskEditor'
import TaskRunner from './pages/TaskRunner'
import ToolsExplorer from './pages/ToolsExplorer'
import FlowBuilder from './pages/FlowBuilder'
import RunDetail from './pages/RunDetail'
import useStore from './store'
import './App.css'

const navItems = [
  { label: 'Dashboard', path: '/', icon: Activity },
  { label: 'Tasks', path: '/tasks', icon: Zap },
  { label: 'Tools', path: '/tools', icon: Settings },
]

export default function App() {
  const { logs, clearLogs } = useStore()
  const [wsConnected, setWsConnected] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className="app-wrapper">
        <AnimatePresence mode="wait">
          <AppContent
            wsConnected={wsConnected}
            logs={logs}
            clearLogs={clearLogs}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </AnimatePresence>
      </div>
    </Router>
  )
}

function AppContent({ wsConnected, logs, clearLogs, mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation()

  return (
    <div className="app bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar-new glass sticky top-0 z-40">
        <div className="navbar-container">
          <motion.div
            className="navbar-brand"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
            <h1 className="gradient-text text-2xl font-bold">Sequential</h1>
            <motion.span
              className={`status ${wsConnected ? 'connected' : 'disconnected'}`}
              animate={{ scale: wsConnected ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className={`status-indicator ${wsConnected ? 'active' : 'inactive'}`}></span>
              {wsConnected ? 'Live' : 'Offline'}
            </motion.span>
          </motion.div>

          {/* Desktop navigation */}
          <ul className="nav-links hidden md:flex">
            {navItems.map((item, idx) => (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* Mobile menu button */}
          <button
            className="md:hidden btn-icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/5 backdrop-blur-md border-t border-white/10"
            >
              <ul className="flex flex-col gap-2 p-4">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="nav-link block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 inline mr-2" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="flex flex-1">
        {/* Main content */}
        <motion.main
          className="main-content flex-1 overflow-y-auto"
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/tasks/:taskId" element={<TaskEditor />} />
            <Route path="/runner/:taskId" element={<TaskRunner />} />
            <Route path="/runner" element={<SelectTaskFirst page="runner" />} />
            <Route path="/tools" element={<ToolsExplorer />} />
            <Route path="/flow-builder/:taskId" element={<FlowBuilder />} />
            <Route path="/flow-builder" element={<SelectTaskFirst page="flow-builder" />} />
            <Route path="/runs/:taskId/:runId" element={<RunDetail />} />
          </Routes>
        </motion.main>

        {/* Sidebar logs */}
        <aside className="sidebar-logs glass hidden lg:flex flex-col">
          <div className="logs-header">
            <h3 className="font-bold gradient-text">Live Logs</h3>
            <motion.button
              onClick={clearLogs}
              className="btn btn-small"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
          </div>
          <div className="logs-container scroll-smooth">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  className="log-line text-xs font-mono text-gray-400"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
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

  if (loading) return (
    <motion.div
      className="loading"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      Loading tasks...
    </motion.div>
  )

  return (
    <div className="page">
      <motion.h2
        className="section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        All Tasks
      </motion.h2>
      <div className="task-grid">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            className="task-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
            layout
          >
            <h3 className="font-bold text-lg mb-2">{task.name || task.id}</h3>
            <p className="text-sm text-gray-400 mb-4">{task.description}</p>
            <div className="card-actions">
              <Link to={`/tasks/${task.id}`} className="btn hover:bg-blue-500/20">Edit</Link>
              <Link to={`/runner/${task.id}`} className="btn-primary">Run</Link>
              <Link to={`/flow-builder/${task.id}`} className="btn hover:bg-purple-500/20">Graph</Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SelectTaskFirst({ page }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <motion.div
      className="loading"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      Loading tasks...
    </motion.div>
  )

  if (tasks.length === 0) return (
    <motion.div
      className="page text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-gray-400">No tasks found. Create one first!</p>
    </motion.div>
  )

  const pageType = page === 'runner' ? 'runner' : 'flow-builder'

  return (
    <div className="page text-center">
      <motion.h2
        className="section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Select a Task
      </motion.h2>
      <p className="text-gray-400 mb-8">Choose a task to continue</p>
      <div className="task-grid max-w-2xl mx-auto">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            className="task-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-bold text-lg mb-2">{task.name || task.id}</h3>
            <p className="text-sm text-gray-400 mb-4">{task.description}</p>
            <Link
              to={`/${pageType}/${task.id}`}
              className="btn-primary w-full text-center"
            >
              Open {pageType === 'runner' ? 'Runner' : 'Flow Builder'}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

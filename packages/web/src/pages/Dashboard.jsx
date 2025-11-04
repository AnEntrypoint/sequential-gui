import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, CheckCircle, AlertCircle, Clock, Zap, TrendingUp } from 'lucide-react'
import '../styles/Dashboard.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const [runs, setRuns] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runsData, tasksData] = await Promise.all([
          fetch('http://localhost:3001/api/runs').then(r => r.json()),
          fetch('http://localhost:3001/api/tasks').then(r => r.json())
        ])
        setRuns(runsData)
        setTasks(tasksData)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(async () => {
      setRefreshing(true)
      try {
        const runsData = await fetch('http://localhost:3001/api/runs?limit=50').then(r => r.json())
        setRuns(runsData)
      } catch (err) {
        console.error('Error refreshing runs:', err)
      }
      setRefreshing(false)
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

  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  if (loading) return (
    <motion.div
      className="loading min-h-screen flex items-center justify-center"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <div className="text-center">
        <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
        <p className="text-xl text-gray-400">Loading dashboard...</p>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      className="page dashboard space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="dashboard-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Task Observability</h1>
          <p className="text-gray-400">Monitor and manage your sequential task executions in real-time</p>
        </div>
        <motion.button
          onClick={() => window.location.reload()}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ repeat: refreshing ? Infinity : 0, duration: 1 }}
          >
            <Zap className="w-4 h-4" />
          </motion.div>
          Refresh
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label text-gray-400 mb-2">Total Runs</p>
              <motion.div
                className="stat-value text-4xl font-bold text-blue-400"
                key={stats.total}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {stats.total}
              </motion.div>
            </div>
            <Activity className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
          <motion.div className="w-full bg-blue-900/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label text-gray-400 mb-2">Completed</p>
              <motion.div
                className="stat-value text-4xl font-bold text-green-400"
                key={stats.completed}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {stats.completed}
              </motion.div>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
          </div>
          <motion.div className="w-full bg-green-900/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card bg-gradient-to-br from-red-500/10 to-rose-600/10 border-red-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label text-gray-400 mb-2">Failed</p>
              <motion.div
                className="stat-value text-4xl font-bold text-red-400"
                key={stats.failed}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {stats.failed}
              </motion.div>
            </div>
            <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
          <motion.div className="w-full bg-red-900/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-red-400 to-rose-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.failed / Math.max(stats.total, 1)) * 100}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="stat-label text-gray-400 mb-2">In Progress</p>
              <motion.div
                className="stat-value text-4xl font-bold text-amber-400"
                key={stats.pending}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {stats.pending}
              </motion.div>
            </div>
            <Clock className="w-10 h-10 text-amber-400 opacity-50 animate-pulse" />
          </div>
          <motion.div className="w-full bg-amber-900/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-amber-400 to-yellow-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.pending / Math.max(stats.total, 1)) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Success Rate Card */}
      <motion.div
        className="success-rate-card"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Success Rate</h3>
            <motion.div
              className="text-5xl font-bold text-green-400"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              {successRate}%
            </motion.div>
          </div>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="8" />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#successGradient)"
                strokeWidth="8"
                strokeDasharray={282.7}
                initial={{ strokeDashoffset: 282.7 }}
                animate={{ strokeDashoffset: 282.7 - (282.7 * successRate / 100) }}
                transition={{ duration: 1.5, delay: 0.6 }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <TrendingUp className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-green-400" />
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        className="dashboard-controls"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <input
          type="text"
          placeholder="Search by task or run ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="in_progress">Running</option>
        </select>
      </motion.div>

      {/* Runs Table */}
      <motion.div
        className="runs-container"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <h3 className="text-2xl font-bold mb-6 gradient-text">Recent Runs</h3>
        {filteredRuns.length === 0 ? (
          <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-gray-400">No runs found</p>
          </motion.div>
        ) : (
          <div className="runs-table">
            <motion.div
              className="table-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div>Task</div>
              <div>Run ID</div>
              <div>Status</div>
              <div>Action</div>
            </motion.div>
            <AnimatePresence mode="popLayout">
              {filteredRuns.map((run, idx) => (
                <motion.div
                  key={run.id}
                  className="table-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="font-medium">{run.taskId}</div>
                  <code className="text-xs text-gray-400">{run.id?.slice(0, 8)}</code>
                  <div className={`badge badge-${run.status}`}>{run.status}</div>
                  <Link
                    to={`/runs/${run.taskId}/${run.id}`}
                    className="btn btn-sm hover:bg-blue-500/20"
                  >
                    View
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

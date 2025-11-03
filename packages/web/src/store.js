import { create } from 'zustand'

const useStore = create((set) => ({
  logs: [],
  selectedTask: null,
  selectedRun: null,
  runningTask: null,

  addLog: (log) => set((state) => ({
    logs: [...state.logs.slice(-99), `[${new Date().toLocaleTimeString()}] ${log}`]
  })),

  clearLogs: () => set({ logs: [] }),

  setSelectedTask: (task) => set({ selectedTask: task }),
  setSelectedRun: (run) => set({ selectedRun: run }),
  setRunningTask: (task) => set({ runningTask: task }),

  addTaskLog: (log) => set((state) => ({
    logs: [...state.logs.slice(-99), `[${new Date().toLocaleTimeString()}] ${log}`]
  }))
}))

export default useStore

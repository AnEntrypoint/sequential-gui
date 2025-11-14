# Sequential GUI - Development Guide for Claude

## Project Overview

**Sequential GUI** is an admin dashboard for the sequential-ecosystem task management system. It provides real-time observability, task editing, debugging, and visual flow building for xstate-based task execution.

### Purpose
- Monitor task runs with real-time WebSocket updates
- Debug and execute tasks with live log streaming
- Edit task code and configurations
- Explore available wrapped services (Gmail, Sheets, OpenAI, etc.)
- Build explicit xstate flow graphs visually
- View detailed run history and results

## Architecture

```
sequential-gui/                    # Monorepo root
├── packages/
│   ├── server/                   # Express.js REST API + WebSocket
│   │   ├── src/index.js         # Main server (267 lines)
│   │   └── package.json         # express, ws, cors, body-parser
│   └── web/                      # React SPA
│       ├── src/
│       │   ├── App.jsx          # Routing, navigation, WebSocket setup
│       │   ├── store.js         # Zustand state management
│       │   ├── pages/           # Route components
│       │   │   ├── Dashboard.jsx      # Task runs overview
│       │   │   ├── TaskEditor.jsx     # Code & config editor
│       │   │   ├── TaskRunner.jsx     # Debug task execution
│       │   │   ├── FlowBuilder.jsx    # State graph builder
│       │   │   ├── ToolsExplorer.jsx  # Service browser
│       │   │   └── RunDetail.jsx      # Single run details
│       │   ├── components/
│       │   │   └── StateMachineVisualizer.jsx
│       │   └── styles/          # CSS modules
│       ├── vite.config.js       # Vite bundler config
│       ├── tailwind.config.js   # TailwindCSS config
│       └── package.json         # react, zustand, framer-motion
├── package.json                  # Workspace root
├── README.md                     # User documentation
├── DEPLOYMENT.md                 # Production deployment guide
└── CLAUDE.md                     # This file
```

## Tech Stack

### Backend (packages/server)
- **Runtime**: Node.js 18+ (ES modules)
- **Framework**: Express.js
- **WebSocket**: ws library
- **Dependencies**: cors, body-parser
- **Storage**: Filesystem-based (tasks/ folder in sequential-ecosystem)
- **Execution**: Spawns `npx sequential-ecosystem` commands

### Frontend (packages/web)
- **Framework**: React 18 (functional components, hooks)
- **Build Tool**: Vite 5
- **Routing**: react-router-dom v6
- **State Management**: Zustand (packages/web/src/store.js)
- **Styling**: TailwindCSS + custom CSS
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **WebSocket**: Native WebSocket API (ws://localhost:3001)

## Environment Configuration

### Required Environment Variables
```bash
# Server (packages/server)
ECOSYSTEM_PATH=/path/to/sequential-ecosystem  # Default: /home/user/sequential-ecosystem
PORT=3001                                      # Default: 3001
NODE_ENV=development|production               # Default: development
```

### Development Ports
- **Web frontend**: http://localhost:3000 (Vite dev server)
- **API server**: http://localhost:3001 (Express)
- **WebSocket**: ws://localhost:3001 (same port as API)

## Key Files and Their Roles

### packages/server/src/index.js (267 lines)
**Main server file** - Express app with WebSocket support

**API Endpoints**:
- `GET /api/health` - Health check
- `GET /api/tasks` - List all tasks from ECOSYSTEM_PATH/tasks/
- `GET /api/tasks/:taskId` - Get task config, code, graph
- `GET /api/tasks/:taskId/runs` - Get runs for specific task
- `GET /api/tasks/:taskId/runs/:runId` - Get single run
- `POST /api/tasks/:taskId/run` - Execute task with input
- `PUT /api/tasks/:taskId/code` - Update task code.js
- `PUT /api/tasks/:taskId/config` - Update task config.json
- `PUT /api/tasks/:taskId/graph` - Update task graph.json
- `GET /api/runs` - Get all runs (paginated, limit=50)
- `GET /api/tools` - List wrapped services
- `GET /api/tools/:toolId/schema` - Get service methods

**WebSocket Events** (broadcast to all clients):
- `{type: 'log', data: string}` - Task execution logs
- `{type: 'runStart', taskId: string}` - Task started
- `{type: 'runComplete', taskId: string}` - Task completed
- `{type: 'runError', taskId: string, error: string}` - Task failed
- `{type: 'taskUpdated', taskId: string, type: 'code'|'config'|'graph'}` - Task modified

**Important Functions**:
- `execCommand(cmd, args, cwd)` - Spawns child process, streams stdout/stderr to WebSocket
- `broadcast(data)` - Sends JSON to all connected WebSocket clients

### packages/web/src/App.jsx (324 lines)
**Main React app** - Routing, navigation, WebSocket client

**Routes**:
- `/` - Dashboard (task runs overview)
- `/tasks` - Task list with edit/run/graph actions
- `/tasks/:taskId` - Task editor
- `/runner/:taskId` - Task runner (debug execution)
- `/flow-builder/:taskId` - Flow graph builder
- `/runs/:taskId/:runId` - Run detail view
- `/tools` - Tools/services explorer

**WebSocket Setup**: Connects on mount, reconnects on close, logs all messages

### packages/web/src/store.js (25 lines)
**Zustand store** - Global state management

**State**:
```javascript
{
  logs: string[],           // Live execution logs (max 100)
  selectedTask: object,     // Currently selected task
  selectedRun: object,      // Currently selected run
  runningTask: string,      // ID of task currently executing
}
```

**Actions**:
- `addLog(log)` - Append log with timestamp
- `clearLogs()` - Clear all logs
- `setSelectedTask(task)` - Set active task
- `setSelectedRun(run)` - Set active run
- `setRunningTask(task)` - Set running task ID

### packages/web/src/pages/
**Page Components** - One per route

**Common Patterns**:
1. `useState` for local state (loading, data, forms)
2. `useEffect` for data fetching on mount
3. Fetch from `http://localhost:3001/api/*` endpoints
4. Framer Motion for animations (`motion.*`, `AnimatePresence`)
5. React Router `Link` and `useNavigate` for navigation
6. Lucide icons for UI elements

**Dashboard.jsx**: Auto-refreshes runs every 5s, status filtering, search, stats cards
**TaskEditor.jsx**: Code editor (textarea), config form, save buttons
**TaskRunner.jsx**: JSON input editor, run button, live logs, result display
**FlowBuilder.jsx**: State list, transitions, add/delete states, JSON preview
**ToolsExplorer.jsx**: Service list, method browser, usage examples
**RunDetail.jsx**: Full run data, input/output, logs, duration

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Start both server and frontend (concurrent)
npm run dev
```

### Running Individually
```bash
# Terminal 1 - Server (port 3001)
npm run dev --workspace=server

# Terminal 2 - Web (port 3000)
npm run dev --workspace=web
```

### Building for Production
```bash
# Build all packages
npm run build

# Start production server (serves built web assets)
npm start --workspace=server
```

### Testing Changes
1. Modify code in packages/server/src/ or packages/web/src/
2. Server auto-restarts (--watch flag)
3. Web hot-reloads (Vite HMR)
4. Check browser console for errors
5. Check server logs for API errors

## Common Development Tasks

### Adding a New API Endpoint
1. Edit `packages/server/src/index.js`
2. Add Express route handler (e.g., `app.get('/api/new-endpoint', ...)`)
3. Use `ECOSYSTEM_PATH` to access sequential-ecosystem files
4. Broadcast WebSocket events if needed (`broadcast({type: 'event', ...})`)
5. Return JSON response

### Adding a New Page
1. Create `packages/web/src/pages/NewPage.jsx`
2. Add route in `packages/web/src/App.jsx` (`<Route path="/new" element={<NewPage />} />`)
3. Add navigation link in `navItems` array if needed
4. Fetch data from API using `useEffect` and `fetch()`
5. Use Framer Motion for animations

### Adding WebSocket Event Handling
**Server** (broadcast):
```javascript
broadcast({ type: 'newEvent', taskId, data: 'value' });
```

**Client** (receive):
```javascript
// In App.jsx useEffect
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'newEvent') {
    // Handle event
  }
};
```

### Updating Zustand Store
1. Edit `packages/web/src/store.js`
2. Add state property to initial state
3. Add action function: `setProperty: (val) => set({ property: val })`
4. Use in components: `const { property, setProperty } = useStore()`

## Code Style and Conventions

### Backend
- **ES modules**: Use `import`/`export`, not `require`
- **Async/await**: Prefer over callbacks/promises
- **Error handling**: Try-catch with 500 status codes
- **File operations**: Use `fs.promises` (async)
- **Child processes**: Use `spawn` with stdio pipes for streaming

### Frontend
- **Functional components**: No class components
- **Hooks**: useState, useEffect, useStore, useNavigate, useParams
- **Props**: Destructure in function params
- **Styling**: TailwindCSS classes + custom CSS in src/styles/
- **Animations**: Framer Motion `motion.*` components, `AnimatePresence` for exits
- **API calls**: Fetch with async/await in useEffect
- **State**: Local state for component data, Zustand for shared/global state

### File Naming
- **Components**: PascalCase.jsx (e.g., TaskEditor.jsx)
- **Utilities**: camelCase.js (e.g., store.js)
- **Styles**: PascalCase.css (e.g., Dashboard.css)

## Important Implementation Details

### Task Execution Flow
1. User submits task from TaskRunner page
2. POST `/api/tasks/:taskId/run` with `{input: {}}`
3. Server broadcasts `{type: 'runStart'}`
4. Server spawns `npx sequential-ecosystem run taskId --input '...' --save`
5. stdout/stderr streamed to WebSocket as `{type: 'log'}`
6. On completion: broadcast `{type: 'runComplete'}` or `{type: 'runError'}`
7. Run saved to `ECOSYSTEM_PATH/tasks/:taskId/runs/:runId.json`

### Task Storage Structure
```
ECOSYSTEM_PATH/
└── tasks/
    └── {taskId}/
        ├── config.json      # Task metadata (name, description, inputs)
        ├── code.js          # Task implementation
        ├── graph.json       # Explicit xstate flow (optional)
        └── runs/
            └── {runId}.json # Execution results
```

### WebSocket Connection Management
- **Client**: Connects on App mount, reconnects on close
- **Server**: Adds client to Set on connection, removes on close/error
- **Broadcast**: Iterates Set, sends to clients with readyState === 1 (OPEN)
- **No authentication**: Local development only (add auth for production)

### State Management Strategy
- **Local state** (useState): Component-specific data (forms, loading, filters)
- **Zustand** (store.js): Shared state (logs, selected task/run)
- **URL params** (useParams): Task/run IDs for routing
- **API as source of truth**: Fetch fresh data on mount, refresh periodically

## Testing Considerations

### Manual Testing Checklist
- [ ] Dashboard loads and displays runs
- [ ] Task list shows all tasks from ECOSYSTEM_PATH
- [ ] Task editor loads code/config correctly
- [ ] Task runner executes and streams logs
- [ ] Flow builder saves graph to graph.json
- [ ] WebSocket connection indicator shows "Live"
- [ ] Real-time log streaming works
- [ ] Navigation between pages works
- [ ] Mobile responsive (navbar collapses)

### Error Scenarios
- **ECOSYSTEM_PATH not found**: Server returns empty arrays, no crash
- **Invalid JSON in config**: Caught in try-catch, returns empty object
- **Task execution fails**: Error broadcasted, displayed in UI
- **WebSocket disconnect**: UI shows "Offline", auto-reconnects
- **Missing task files**: Returns 404 or empty data

## Performance Considerations

### Backend
- **File I/O**: All async (fs.promises)
- **Child processes**: Use spawn (streaming) not exec (buffered)
- **WebSocket**: Broadcast only to OPEN clients (readyState check)
- **Run history**: Limit to 50 runs by default (pagination)

### Frontend
- **Dashboard refresh**: 5s interval (not too aggressive)
- **Log limit**: Max 100 logs (array slice)
- **Animations**: Use Framer Motion (GPU-accelerated)
- **Code splitting**: Vite automatic (lazy load pages)

## Common Issues and Solutions

### "Cannot connect to ecosystem"
- Check `ECOSYSTEM_PATH` environment variable
- Verify `tasks/` folder exists in ecosystem
- Ensure permissions allow reading/writing

### "WebSocket connection failed"
- Verify server running on port 3001
- Check firewall allows WebSocket connections
- Ensure CORS configured correctly

### "Tasks not appearing"
- Check `config.json` files are valid JSON
- Verify folder structure matches expected format
- Check server logs for file read errors

### "Hot reload not working"
- Server: Uses `--watch` flag (Node 18+), restart if needed
- Web: Vite HMR should work, check console for errors
- Hard refresh browser (Ctrl+Shift+R)

## Security Notes

### Current State (Development)
- **No authentication**: Open API and WebSocket
- **No authorization**: All clients can execute any task
- **No input validation**: Trusts all task inputs
- **Local only**: Assumes localhost deployment

### Production Requirements (see DEPLOYMENT.md)
- Add API key authentication
- Implement JWT token validation
- Add input sanitization/validation
- Configure CORS for specific domains
- Use HTTPS/WSS for encrypted connections
- Add rate limiting
- Audit logging for task execution

## Dependencies and Versions

### Server
- express ^4.18.2
- ws ^8.14.2
- cors ^2.8.5
- body-parser ^1.20.2

### Web
- react ^18.2.0
- react-dom ^18.2.0
- react-router-dom ^6.16.0
- zustand ^4.4.2
- lucide-react ^0.292.0
- framer-motion ^10.16.4
- tailwindcss ^3.3.6
- vite ^5.0.0

### Update Strategy
- Run `npm outdated` to check for updates
- Test updates in development before deploying
- Pay attention to breaking changes in React Router, Vite

## Integration with sequential-ecosystem

### Relationship
- Sequential-gui is a **standalone tool** for managing sequential-ecosystem
- **Does not modify** core sequential-ecosystem code
- **Reads/writes** task files in ECOSYSTEM_PATH
- **Executes** tasks via CLI (`npx sequential-ecosystem run ...`)

### Required sequential-ecosystem Setup
1. Sequential-ecosystem must be installed (npm/npx accessible)
2. ECOSYSTEM_PATH must point to valid sequential-ecosystem directory
3. `tasks/` folder must exist
4. Tasks must follow standard structure (config.json, code.js)

### Wrapped Services (Tools)
- Server provides hardcoded list in `/api/tools` endpoint
- Real schemas should come from tasker-wrapped-services package
- Current implementation is placeholder (lines 185-232 in server/index.js)
- **Future**: Dynamic service discovery from ecosystem

## Future Improvements

### Suggested Enhancements
- Add task creation UI (currently CLI-only)
- Real-time collaboration (multiple users editing)
- Task scheduling/automation
- Performance metrics and analytics
- Drag-and-drop flow builder (vs current form-based)
- Code syntax highlighting (Monaco editor)
- Database backend option (PostgreSQL/Supabase)
- Redis for WebSocket scaling
- Authentication/authorization system

### Technical Debt
- Hardcoded service list in server (should be dynamic)
- No tests (add Jest for server, Vitest for web)
- No TypeScript (consider migration)
- WebSocket reconnection logic could be improved
- Error handling could be more granular

## Quick Reference

### Start Development
```bash
npm install && npm run dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

### File a Bug or Feature
- Check existing GitHub issues
- Include browser/Node.js version
- Provide reproduction steps
- Check server logs for API errors

### Need Help?
- Read README.md for user documentation
- Check DEPLOYMENT.md for production setup
- Review sequential-ecosystem docs for task structure
- Examine code comments in packages/server/src/index.js

---

**Last Updated**: 2025-11-14
**Maintainer**: AnEntrypoint
**License**: Same as sequential-ecosystem

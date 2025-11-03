# Sequential Ecosystem Admin GUI

A comprehensive admin dashboard for the sequential-ecosystem task management system. Provides full observability, debugging capabilities, and visual tools for managing infinite-length task execution with xstate.

## 🎯 Features

### 1. **Task Runs Observability Dashboard**
- Real-time view of all task executions
- Filtering by status (completed, failed, pending, running)
- Search by task name or run ID
- Statistics: total runs, completion rate, failure rate
- Duration tracking for each run
- Quick links to run details and task actions

### 2. **Debug Task Runner**
- Execute tasks with custom JSON input
- Live execution logs streaming
- Task schema validation based on config
- Result preview and inspection
- Error reporting and diagnostics

### 3. **Task Code Editor**
- Edit task code with syntax highlighting
- Modify task configuration (name, description, inputs)
- Real-time JSON validation
- Save changes back to storage
- Support for both implicit and explicit xstate patterns

### 4. **Tools & Services Explorer**
- Browse all available wrapped services
  - Google APIs (Gmail, Sheets, Docs)
  - OpenAI API
  - Supabase client
  - More services coming...
- View authentication requirements
- Explore available methods for each service
- Code examples for service integration
- Direct usage within task code

### 5. **Explicit xstate Flow Tree Builder**
- Visual state machine builder
- Create/edit/delete states
- Configure state transitions (onDone, onError)
- Mark final states
- JSON preview of entire flow graph
- Save flow graphs back to tasks

### 6. **Real-time WebSocket Support**
- Live task execution updates
- Log streaming during execution
- Task status changes
- Multi-user synchronization

## 🏗️ Architecture

```
admin-gui/
├── packages/
│   ├── server/              # Express.js REST API & WebSocket server
│   │   └── src/
│   │       └── index.js     # API endpoints, task execution, storage access
│   │
│   ├── web/                 # React.js frontend dashboard
│   │   ├── src/
│   │   │   ├── App.jsx      # Main app with routing
│   │   │   ├── store.js     # Zustand state management
│   │   │   ├── pages/       # Route pages (Dashboard, Editor, etc.)
│   │   │   └── styles/      # Component styles
│   │   ├── index.html       # HTML entry point
│   │   └── vite.config.js   # Vite configuration
│   │
│   └── shared/              # Shared utilities (future)
│
└── README.md
```

## 📦 API Endpoints

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:taskId` - Get task details (code, config, graph)
- `POST /api/tasks/:taskId/run` - Execute task
- `PUT /api/tasks/:taskId/code` - Update task code
- `PUT /api/tasks/:taskId/config` - Update task config
- `PUT /api/tasks/:taskId/graph` - Update state graph

### Runs
- `GET /api/runs` - List all runs with pagination
- `GET /api/tasks/:taskId/runs` - Get runs for specific task
- `GET /api/tasks/:taskId/runs/:runId` - Get single run details

### Tools
- `GET /api/tools` - List available services
- `GET /api/tools/:toolId/schema` - Get service schema and methods

### WebSocket
- `ws://localhost:3001` - Real-time events
  - `type: 'log'` - Execution logs
  - `type: 'runStart'` - Run started
  - `type: 'runComplete'` - Run finished
  - `type: 'runError'` - Run failed
  - `type: 'taskUpdated'` - Task code/config changed

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/AnEntrypoint/admin-gui.git
cd admin-gui

# Install dependencies
npm install

# Or with bun
bun install
```

### Environment Setup

```bash
# Set the sequential-ecosystem path (optional, defaults to /home/user/sequential-ecosystem)
export ECOSYSTEM_PATH=/path/to/sequential-ecosystem

# Set server port (optional, defaults to 3001)
export PORT=3001
```

### Development

```bash
# Start both server and web frontend (concurrent)
npm run dev

# Or separately:
# Terminal 1 - Server
npm run dev --workspace=server

# Terminal 2 - Web
npm run dev --workspace=web
```

Access the dashboard at `http://localhost:3000`

### Production Build

```bash
# Build all packages
npm run build

# Start server only (web should be built and served by nginx/CDN)
npm start --workspace=server
```

## 📊 Dashboard Features

### Statistics Panel
- **Total Runs**: All executed tasks
- **Completed**: Successfully finished tasks
- **Failed**: Tasks with errors
- **Running**: Pending/in-progress tasks

### Run Table
- Real-time data updates every 5 seconds
- Sortable columns
- Status badges (completed, failed, pending)
- Quick actions to view/rerun

### Search & Filter
- Search by task name or run ID
- Filter by status
- Responsive table for mobile devices

## 🔧 Task Runner

### Input Validation
- JSON schema based on task configuration
- Real-time JSON validation
- Expected input parameters shown
- Error messages for invalid input

### Live Execution
- Task logs streamed in real-time
- Execution status indicator
- Result preview after completion
- Error stack traces on failure

## 📝 Code Editor

### Code Editing
- Full JavaScript syntax support
- Async/await highlighting
- Task function template

### Configuration
- Task name and description
- Input parameters array
  - Name, type, description per parameter
  - JSON editing with validation

## 🛠️ Tools Explorer

### Service Discovery
- Browse all wrapped services
- View service descriptions
- Check authentication requirements

### Method Browser
- List available methods per service
- Usage examples in task code
- Method signatures and parameters

### Code Snippets
- Ready-to-use integration examples
- Copy-paste `__callHostTool__` patterns
- Service-specific best practices

## 🎨 Flow Builder

### Visual State Machine Editor
- Drag-and-drop feel (enhanced UX in future)
- State creation/deletion
- Transition configuration

### State Properties
- Description for each state
- Success path (onDone)
- Error path (onError)
- Final state markers

### Graph Export
- Real-time JSON preview
- Save to task graph.json
- Validation of graph structure

## 🔄 WebSocket Events

### Real-time Updates
```javascript
// Client side, in Web app
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)

  // Log streaming
  if (data.type === 'log') {
    console.log(data.data) // Raw log output
  }

  // Run lifecycle
  if (data.type === 'runStart') {
    console.log(`Task ${data.taskId} started`)
  }

  if (data.type === 'runComplete') {
    console.log(`Task ${data.taskId} completed`)
  }

  if (data.type === 'runError') {
    console.error(`Task ${data.taskId} error: ${data.error}`)
  }

  // Task changes
  if (data.type === 'taskUpdated') {
    console.log(`Task ${data.taskId} ${data.type} updated`)
  }
}
```

## 🌐 Multi-User Support

The system supports multiple concurrent users:
- WebSocket broadcasts to all connected clients
- Real-time synchronization of task updates
- Concurrent task execution with isolated state
- Run history is globally shared

## 🔐 Security Considerations

- **Local Development**: No authentication needed
- **Production**: Recommended to add:
  - API key authentication
  - JWT token support
  - Role-based access control
  - Rate limiting
  - CORS configuration for trusted domains

## 📈 Scaling

### Single Node
- Use with folder-based task storage
- Local WebSocket connections
- Perfect for development and small deployments

### Distributed
- Use with PostgreSQL/Supabase backend
- WebSocket events propagated via Redis (future)
- Multiple admin-gui instances behind load balancer
- Shared state across instances

## 🐛 Troubleshooting

### Server won't connect to ecosystem
```bash
# Check ecosystem path
echo $ECOSYSTEM_PATH

# If not set, server defaults to /home/user/sequential-ecosystem
export ECOSYSTEM_PATH=/correct/path
```

### WebSocket connection failed
- Check server is running on port 3001
- Check CORS configuration in browser console
- Ensure firewall allows WebSocket connections

### Tasks not appearing
- Verify ECOSYSTEM_PATH points to correct directory
- Check `tasks/` folder exists in ecosystem
- Ensure task config.json files are valid JSON

## 📚 Learning Path

1. **Start**: Create a task with `npx sequential-ecosystem create-task`
2. **Run**: Execute it through the Debug Task Runner
3. **View**: Check results in the Dashboard
4. **Edit**: Use the Code Editor to modify task logic
5. **Explore**: Browse services in Tools Explorer
6. **Advanced**: Build state graphs in Flow Builder

## 🤝 Contributing

Improvements welcome! Areas for enhancement:
- Visual state graph drawing (vs. JSON editor)
- Drag-and-drop task creation
- Advanced filtering and analytics
- Task scheduling and automation
- Metrics and performance tracking

## 📄 License

Same as sequential-ecosystem

## 🔗 Related Projects

- [sequential-ecosystem](https://github.com/AnEntrypoint/sequential-ecosystem) - Core task execution system
- [tasker-sequential](../sequential-ecosystem/packages/tasker-sequential) - Task runner
- [sequential-fetch](../sequential-ecosystem/packages/sequential-fetch) - Implicit xstate VM
- [sequential-flow](../sequential-ecosystem/packages/sequential-flow) - Explicit xstate executor

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review sequential-ecosystem docs
3. Open an issue on GitHub
4. Check WebSocket and API logs

---

**Built with ❤️ for the sequential-ecosystem community**

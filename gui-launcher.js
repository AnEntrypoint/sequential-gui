#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nowISO = () => new Date().toISOString();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(bodyParser.json());

const ECOSYSTEM_PATH = process.env.ECOSYSTEM_PATH || process.cwd();
const TASKS_PATH = join(ECOSYSTEM_PATH, 'tasks');

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

const broadcast = (data) => {
  clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  });
};

async function execCommand(cmd, args, cwd = ECOSYSTEM_PATH) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'pipe' });
    let stdout = '', stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data;
      broadcast({ type: 'log', data: data.toString() });
    });
    proc.stderr.on('data', (data) => {
      stderr += data;
      broadcast({ type: 'log', data: data.toString() });
    });

    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout));
    });
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: nowISO() });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await fs.readdir(TASKS_PATH).catch(() => []);
    const taskList = [];

    for (const taskName of tasks) {
      const configPath = join(TASKS_PATH, taskName, 'config.json');
      try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        taskList.push({ ...config, id: taskName });
      } catch (e) {
        taskList.push({ id: taskName, name: taskName });
      }
    }

    res.json(taskList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const taskPath = join(TASKS_PATH, req.params.taskId);
    const [config, code, graph] = await Promise.allSettled([
      fs.readFile(join(taskPath, 'config.json'), 'utf8').then(JSON.parse),
      fs.readFile(join(taskPath, 'code.js'), 'utf8'),
      fs.readFile(join(taskPath, 'graph.json'), 'utf8').then(JSON.parse).catch(() => null)
    ]);

    res.json({
      id: req.params.taskId,
      config: config.status === 'fulfilled' ? config.value : {},
      code: code.status === 'fulfilled' ? code.value : '',
      graph: graph.status === 'fulfilled' ? graph.value : null
    });
  } catch (err) {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.get('/api/tasks/:taskId/runs', async (req, res) => {
  try {
    const runsPath = join(TASKS_PATH, req.params.taskId, 'runs');
    const runs = await fs.readdir(runsPath).catch(() => []);
    const runList = [];

    for (const runFile of runs) {
      try {
        const run = JSON.parse(await fs.readFile(join(runsPath, runFile), 'utf8'));
        runList.push(run);
      } catch (e) {}
    }

    res.json(runList.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:taskId/run', async (req, res) => {
  try {
    const { input = {} } = req.body;
    broadcast({ type: 'runStart', taskId: req.params.taskId });

    await execCommand('npx', ['sequential-ecosystem', 'run', req.params.taskId, '--input', JSON.stringify(input), '--save']);

    broadcast({ type: 'runComplete', taskId: req.params.taskId });
    res.json({ success: true });
  } catch (err) {
    broadcast({ type: 'runError', taskId: req.params.taskId, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`GUI Server running on http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Ecosystem path: ${ECOSYSTEM_PATH}`);
});

#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const ECOSYSTEM_PATH = process.env.ECOSYSTEM_PATH || process.cwd();
const useDesktop = process.argv.includes('--desktop');

const serverPath = useDesktop
  ? join(__dirname, '../osjs-webdesktop/src/server/index.js')
  : join(__dirname, 'packages/server/src/index.js');

console.log(`Starting GUI on http://localhost:${PORT}`);
console.log(`Using ${useDesktop ? 'OS.js Desktop' : 'Sequential GUI'}`);
console.log(`Ecosystem path: ${ECOSYSTEM_PATH}`);

const proc = spawn('node', [serverPath], {
  cwd: useDesktop ? join(__dirname, '../osjs-webdesktop') : __dirname,
  stdio: 'inherit',
  env: { 
    ...process.env,
    PORT,
    ECOSYSTEM_PATH
  }
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  proc.kill('SIGINT');
});

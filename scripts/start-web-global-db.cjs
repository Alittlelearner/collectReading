const { spawn } = require('node:child_process');
const { join } = require('node:path');

const root = join(__dirname, '..');
const isWindows = process.platform === 'win32';

const children = [
  spawn(process.execPath, [join(root, 'scripts', 'sqlite-server.cjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  }),
  spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'web'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_COLLECTION_READ_DB_API_URL:
        process.env.EXPO_PUBLIC_COLLECTION_READ_DB_API_URL || 'http://127.0.0.1:47631',
    },
  }),
];

for (const child of children) {
  child.on('exit', (code) => {
    for (const item of children) {
      if (item !== child && !item.killed) {
        item.kill();
      }
    }
    process.exit(code || 0);
  });
}

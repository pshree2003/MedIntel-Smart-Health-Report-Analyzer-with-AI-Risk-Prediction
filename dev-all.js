import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [
  spawn(npmCommand, ['run', 'ai-server'], { stdio: 'inherit', shell: true }),
  spawn(npmCommand, ['run', 'dev'], { stdio: 'inherit', shell: true })
];

const stopAll = () => {
  processes.forEach((child) => child.kill());
};

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
process.on('exit', stopAll);
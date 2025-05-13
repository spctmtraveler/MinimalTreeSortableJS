// Start both servers (API and web)
const { spawn } = require('child_process');
const path = require('path');

// Function to start a process
function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${name}] Error: ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
    // Restart the process if it crashes
    if (code !== 0) {
      console.log(`Restarting ${name}...`);
      setTimeout(() => {
        startProcess(command, args, name);
      }, 1000);
    }
  });
  
  return proc;
}

// Start the API server
const apiProcess = startProcess('node', ['server.js'], 'API Server');

// Start the web server
const webProcess = startProcess('python', ['-m', 'http.server', '5000'], 'Web Server');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  apiProcess.kill();
  webProcess.kill();
  process.exit(0);
});
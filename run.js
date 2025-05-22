const { spawn } = require('child_process');
const chokidar = require('chokidar');

let serverProcess = null;

function startServer() {
    if (serverProcess) {
        console.log('Stopping existing server...');
        serverProcess.kill();
    }
    console.log('Starting server...');
    serverProcess = spawn('node', ['index.js'], { stdio: 'inherit' });

    serverProcess.on('exit', (code, signal) => {
        if (signal) {
            console.log(`Server process was killed by signal: ${signal}`);
        } else {
            console.log(`Server process exited with code: ${code}`);
        }
    });
}

const watcher = chokidar.watch(['index.js', 'app.py', 'static/js/main.js', 'index.html'], {
    ignoreInitial: true,
});

watcher.on('change', (path) => {
    console.log(`Detected change in ${path}. Restarting server...`);
    startServer();
});

// Start the server initially
startServer();
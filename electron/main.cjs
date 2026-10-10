const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'PageWise - GATE OS Visual & Infographic Tutor',
    backgroundColor: '#020617', // slate-950
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Resolve path to built dist/index.html
  const candidatePaths = [
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, 'dist/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(app.getAppPath(), 'dist/index.html'),
    path.join(process.resourcesPath || '', 'app/dist/index.html'),
    path.join(process.resourcesPath || '', 'dist/index.html'),
  ];

  let indexPath = candidatePaths.find(p => fs.existsSync(p));

  if (!indexPath) {
    console.error('Could not find dist/index.html in candidate paths:', candidatePaths);
    indexPath = path.join(__dirname, '../dist/index.html');
  }

  win.loadFile(indexPath).catch(err => {
    console.error('Failed to load file:', err);
  });

  // Open external links in default web browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  return win;
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

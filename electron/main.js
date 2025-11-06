// main.js
require('dotenv').config();
const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const isDev = require('electron-is-dev');

// --- Core Modules ---
// Import the promise and saveDatabase
const { dbInitializationPromise, saveDatabase } = require('./database');
const { startAPIServer, stopAPIServer } = require('./api/server');
const { registerIpcHandlers } = require('./ipc/register');
const { initGitRepo } = require('./services/gitService');

// --- Global References ---
let mainWindow;
let appIcon = null;
app.isQuitting = false;

// --- Logging Setup ---
console.log('=== MAIN.JS STARTED ===');
log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
log.info('App starting...');
console.log('Logging configured, app starting...');

if (isDev) {
  try {
    require('electron-debug')();
    console.log('Main process debug logging enabled');
  } catch (err) {
    console.log('Basic console logging enabled (electron-debug not available)');
  }
}

// --- Window & Tray Management ---

async function createWindow() {
  // Wait for the DB promise to resolve. This is safe,
  // as the promise is memoized and will resolve instantly if already done.
  await dbInitializationPromise;
  await initGitRepo();

  if (mainWindow) {
    mainWindow.show();
    return;
  }

  log.info('Creating window...');

  const preloadPath = isDev
    ? path.join(process.cwd(), 'dist/electron-preload/preload.js')
    : path.join(__dirname, 'preload.js');
  
  if (!fs.existsSync(preloadPath)) {
    log.error('FATAL: Preload script not found at:', preloadPath);
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      webSecurity: false,
      nodeIntegration: false,
    }
  });

  const appUrl = isDev
    ? 'http://localhost:5169' // Vite dev server
    : `file://${path.join(__dirname, '../index.html')}`; // Packaged app
  log.info('Loading URL:', appUrl);
  
  mainWindow.loadURL(appUrl);
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  createTray();
}

function createTray() {
  if (appIcon) return;

  const iconPath = path.join(__dirname, '../../icon.png');
  log.info('Tray icon path:', iconPath);
  
  appIcon = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        saveDatabase();
        stopAPIServer();
        app.quit();
      }
    }
  ]);

  appIcon.setToolTip('Project Manager');
  appIcon.setContextMenu(contextMenu);

  appIcon.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// --- App Lifecycle ---

app.whenReady().then(async () => {
  try {
    // 1. Wait for the database to be ready
    await dbInitializationPromise;

    // 2. Register all IPC handlers (they are now safe to be called)
    registerIpcHandlers();

    // 3. Start the API server
    startAPIServer();

    // 4. Create the main window
    createWindow();

  } catch (err) {
    log.error('Fatal: Failed to initialize application:', err);
    process.exit(1);
  }
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    saveDatabase();
    stopAPIServer();
    app.quit();
  }
  // On non-macOS, app stays open in tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
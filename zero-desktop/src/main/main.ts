import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { IpcHandler } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;
let ipcHandler: IpcHandler | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Set up IPC handler
  ipcHandler = new IpcHandler();
  ipcHandler.setMainWindow(mainWindow.webContents);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (ipcHandler) {
    ipcHandler.cleanup();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle orphaned processes on quit
app.on('before-quit', () => {
  if (ipcHandler) {
    ipcHandler.cleanup();
  }
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

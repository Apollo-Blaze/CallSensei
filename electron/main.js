import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
function getViteDevServerUrl() {
    return process.env.VITE_DEV_SERVER_URL || null;
}
async function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    const devServerUrl = getViteDevServerUrl();
    if (devServerUrl) {
        await mainWindow.loadURL(devServerUrl);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
        await mainWindow.loadFile(indexHtmlPath);
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        void createMainWindow();
    }
});
app.whenReady().then(() => {
    void createMainWindow();
});
//# sourceMappingURL=main.js.map
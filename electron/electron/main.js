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
ipcMain.handle("github-login", async (_, code) => {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: "Ov23liR0F5RL7r5YcC8H",
        //client_secret: process.env.GITHUB_CLIENT_SECRET,
        client_secret: "4d503db4c090502b393edd5ecbe7ffe3360c8b10",
        code,
      }),
    });
    console.log("result from login",res);
    const data =  res.json();
    const token = data.access_token
    return token;
  });
  
app.whenReady().then(() => {
    void createMainWindow();
});
//# sourceMappingURL=main.js.map
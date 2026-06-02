const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

const ICON_PATH = path.join(__dirname, '..', 'electron', 'icon.ico')
const fs = require('fs')
const iconExists = fs.existsSync(ICON_PATH)

function createWindow() {
  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    title: 'RecrutIA',
    ...(iconExists ? { icon: ICON_PATH } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  })

  // Charge directement le dashboard (pas le formulaire candidat)
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
    hash: '/login'
  })

  // Ouvre les liens externes dans le navigateur système, pas dans Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage, shell } = require('electron')
const path = require('path')
const fs   = require('fs')
const os   = require('os')

const IS_WIN = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

let win
let tray
let snappedRight = false

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    thickFrame: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('floatboard.html')

  // Block resize/move at the event level
  win.on('will-resize', e => e.preventDefault())
  win.on('will-move', e => e.preventDefault())

  // Windows: intercept WM_NCHITTEST so the OS never sees a resize border
  if (IS_WIN && win.hookWindowMessage) {
    const WM_NCHITTEST = 0x0084
    const HTCLIENT     = Buffer.alloc(8)
    HTCLIENT.writeInt32LE(1, 0)
    win.hookWindowMessage(WM_NCHITTEST, () => HTCLIENT)
  }

  // Click-through with forwarding so mousemove still fires in the renderer
  win.setIgnoreMouseEvents(true, { forward: true })

  // Hide to tray instead of quitting
  win.on('close', e => {
    if (!app.isQuiting) {
      e.preventDefault()
      win.hide()
    }
  })
}

function createTray() {
  // Load the real icon for the tray
  const iconPath = path.join(__dirname, 'icon.png')
  let icon
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
    // macOS menu bar icons should be ~16x16, resize if needed
    if (IS_MAC) icon = icon.resize({ width: 16, height: 16 })
  } else {
    // Fallback: tiny white square
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABklEQVQ4jWNgYGBgIIAGAAQAAgABAAD/ANwAAAAASUVORK5CYII='
    )
  }

  tray = new Tray(icon)
  tray.setToolTip('Floatboard')

  const menu = Menu.buildFromTemplate([
    { label: 'Show',      click: () => { win.show(); win.focus() } },
    { label: 'Hide',      click: () => win.hide() },
    { type: 'separator' },
    { label: 'Quit',      click: () => { app.isQuiting = true; app.quit() } }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

// Windows-only: create .bat launcher shortcuts on first run
function createShortcuts() {
  if (!IS_WIN) return
  const exePath    = process.execPath
  const appPath    = __dirname
  const desktopDir = path.join(os.homedir(), 'Desktop')
  const startDir   = path.join(
    os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'
  )
  const bat     = `@echo off\nstart "" "${exePath}" "${appPath}"\n`
  const batName = 'Floatboard.bat'
  try {
    fs.writeFileSync(path.join(desktopDir, batName), bat)
    fs.writeFileSync(path.join(startDir,   batName), bat)
  } catch (e) {
    console.log('Shortcut creation skipped:', e.message)
  }
}

const shortcutFlag = path.join(app.getPath('userData'), '.shortcuts-created')
if (IS_WIN && !fs.existsSync(shortcutFlag)) {
  app.whenReady().then(() => {
    createShortcuts()
    try { fs.writeFileSync(shortcutFlag, '1') } catch (_) {}
  })
}

// ── PERSISTENT DATA — single file in user's home dir ──────────
const DATA_FILE = path.join(os.homedir(), '.floatboard-data.json')

ipcMain.handle('save-data', async (_, json) => {
  try {
    fs.writeFileSync(DATA_FILE, json, 'utf8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return { ok: true, data: fs.readFileSync(DATA_FILE, 'utf8') }
    }
    return { ok: true, data: null }
  } catch (e) {
    return { ok: false, data: null, error: e.message }
  }
})

ipcMain.on('set-ignore-mouse', (_, ignore) => {
  if (win) win.setIgnoreMouseEvents(ignore, { forward: true })
})

ipcMain.on('quit', () => {
  app.isQuiting = true
  app.quit()
})

ipcMain.on('minimize', () => win && win.minimize())

ipcMain.on('toggle-always-on-top', () => {
  if (!win) return
  const current = win.isAlwaysOnTop()
  win.setAlwaysOnTop(!current)
  win.webContents.send('always-on-top-changed', !current)
})

ipcMain.on('open-external', (_, url) => {
  shell.openExternal(url)
})

ipcMain.on('snap-window', () => {
  if (!win) return
  const { width } = screen.getPrimaryDisplay().workAreaSize
  const bounds    = win.getBounds()
  snappedRight    = !snappedRight
  const newX      = snappedRight ? width - bounds.width : 0
  win.setPosition(newX, 0)
})

app.on('before-quit', () => { app.isQuiting = true })

app.whenReady().then(() => {
  createWindow()
  createTray()

  globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (!win) return
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Don't quit — tray keeps the app alive
})

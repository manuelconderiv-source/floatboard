const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage, shell } = require('electron')
const path  = require('path')
const fs    = require('fs')
const os    = require('os')
const https = require('https')

const IS_WIN = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'
const IS_DEV = process.argv.includes('--dev') || process.env.FLOATBOARD_DEV === '1'

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disk-cache-size', '0')

// ── SINGLE-INSTANCE LOCK ──
// When `npm start` is run while an instance is already running, the second
// instance immediately tells the first one to reload (picks up renderer code
// changes) and then quits. No more accumulating windows during dev.
const gotInstanceLock = app.requestSingleInstanceLock()
if (!gotInstanceLock) {
  app.quit()
  process.exit(0)
}

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

// ── CLAUDE USAGE — parse local JSONL logs ─────────────────────
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'projects')

ipcMain.handle('read-claude-usage', async () => {
  try {
    if (!fs.existsSync(CLAUDE_DIR)) return { ok: true, messages: 0, tokensIn: 0, tokensOut: 0 }

    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
    let messages = 0, tokensIn = 0, tokensOut = 0

    // Walk all project dirs for .jsonl files
    const projects = fs.readdirSync(CLAUDE_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())

    for (const proj of projects) {
      const projPath = path.join(CLAUDE_DIR, proj.name)
      const files = fs.readdirSync(projPath)
        .filter(f => f.endsWith('.jsonl'))

      for (const file of files) {
        const filePath = path.join(projPath, file)
        // Skip files older than 5 hours by mtime
        const stat = fs.statSync(filePath)
        if (stat.mtimeMs < fiveHoursAgo) continue

        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n').filter(l => l.trim())

        for (const line of lines) {
          try {
            const entry = JSON.parse(line)
            if (entry.type !== 'assistant' || !entry.message?.usage) continue
            const ts = new Date(entry.timestamp).getTime()
            if (ts < fiveHoursAgo) continue

            messages++
            const u = entry.message.usage
            tokensIn  += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)
            tokensOut += (u.output_tokens || 0)
          } catch (_) { /* skip malformed lines */ }
        }
      }
    }

    return { ok: true, messages, tokensIn, tokensOut }
  } catch (e) {
    return { ok: false, messages: 0, tokensIn: 0, tokensOut: 0, error: e.message }
  }
})

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

ipcMain.handle('capture-board', async () => {
  const img = await win.webContents.capturePage()
  return img.toDataURL()
})

// ── SCREENSHOT STUDIO — save captured PNGs to disk ──────────
// Used by the dev-only screenshot studio (Ctrl+Shift+B etc.) to
// dump theme/menu captures into ~/Pictures/Floatboard-Screenshots/.
const SCREENSHOTS_DIR = path.join(os.homedir(), 'Pictures', 'Floatboard-Screenshots')
ipcMain.handle('save-screenshot', async (_, { filename, dataUrl }) => {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    // Strip "data:image/png;base64," prefix
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buf = Buffer.from(base64, 'base64')
    const safeName = filename.replace(/[^\w.-]/g, '_')
    const filePath = path.join(SCREENSHOTS_DIR, safeName)
    fs.writeFileSync(filePath, buf)
    return { ok: true, path: filePath }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('open-screenshots-folder', async () => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  shell.openPath(SCREENSHOTS_DIR)
  return { ok: true, path: SCREENSHOTS_DIR }
})

// ── GLASS THEME — vibrancy for macOS (Windows acrylic can't combine
// with our transparent click-through window, so we rely on CSS
// backdrop-filter + a transparent body for Windows instead).
ipcMain.on('set-glass-mode', (_, enabled) => {
  if (!win) return
  if (IS_MAC && typeof win.setVibrancy === 'function') {
    try { win.setVibrancy(enabled ? 'under-window' : null) } catch (_) {}
  }
})

// ── GUMROAD LICENSE VERIFICATION ──────────────────────────────
// Public API — no secret required. Docs:
// https://help.gumroad.com/article/76-license-keys
// POST https://api.gumroad.com/v2/licenses/verify
//   params: product_id, license_key, increment_uses_count (true/false)
// Returns { success: true, purchase: {...}, uses: N } on valid key.
// We do this from main (Node) instead of renderer (fetch) to avoid CORS
// and to keep the product_id out of DevTools for shipped builds.
ipcMain.handle('verify-license', async (_, { productId, licenseKey, incrementUses }) => {
  return new Promise(resolve => {
    if (!productId || !licenseKey) {
      return resolve({ ok: false, code: 'missing_params', message: 'Missing product id or license key.' })
    }
    // Manual URL encoding for reliability — URLSearchParams is stricter than
    // application/x-www-form-urlencoded needs to be for Gumroad.
    const encode = s => encodeURIComponent(s)
    const postData =
      'product_id='         + encode(productId) +
      '&license_key='       + encode(licenseKey.trim()) +
      '&increment_uses_count=' + (incrementUses === false ? 'false' : 'true')

    const req = https.request({
      hostname: 'api.gumroad.com',
      port: 443,
      path: '/v2/licenses/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const data = JSON.parse(body)
          if (data.success) {
            const p = data.purchase || {}
            if (p.refunded || p.chargebacked) {
              return resolve({ ok: false, code: 'refunded', message: 'This license has been refunded.' })
            }
            if (p.disputed) {
              return resolve({ ok: false, code: 'disputed', message: 'This license is disputed. Contact support.' })
            }
            return resolve({
              ok: true,
              code: 'active',
              key: licenseKey.trim(),
              email: p.email || '',
              saleId: p.sale_id || '',
              productName: p.product_name || 'Floatboard Pro',
              uses: data.uses || 0,
              verifiedAt: Date.now()
            })
          }
          return resolve({
            ok: false,
            code: 'invalid',
            message: data.message || 'Invalid license key.'
          })
        } catch (e) {
          return resolve({ ok: false, code: 'parse_error', message: 'Unexpected response from Gumroad.' })
        }
      })
    })
    req.on('timeout', () => {
      req.destroy()
      resolve({ ok: false, code: 'timeout', message: 'Verification timed out. Check your connection.' })
    })
    req.on('error', err => {
      resolve({ ok: false, code: 'network', message: 'Network error: ' + err.message })
    })
    req.write(postData)
    req.end()
  })
})

// ── DEV MODE FLAG ─────────────────────────────────────────────
// Only true when launched with --dev or FLOATBOARD_DEV=1.
// Dev keyboard shortcuts (premium toggle, clear license, paste
// test license) are ONLY registered in the renderer when this is
// true, so shipped .exe users can never accidentally trigger them.
ipcMain.handle('is-dev-mode', async () => IS_DEV)

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

// Second instance launched (e.g. another `npm start`): reload existing
// window so renderer changes take effect without manually killing.
app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
    win.webContents.reload()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  // Re-anchor to primary screen when displays change
  function anchorToPrimary() {
    if (!win) return
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    win.setBounds({ x: 0, y: 0, width, height })
  }
  screen.on('display-added',   anchorToPrimary)
  screen.on('display-removed', anchorToPrimary)
  screen.on('display-metrics-changed', anchorToPrimary)

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

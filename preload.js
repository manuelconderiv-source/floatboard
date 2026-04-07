const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  quit:              ()      => ipcRenderer.send('quit'),
  minimize:          ()      => ipcRenderer.send('minimize'),
  setIgnoreMouse:    (v)     => ipcRenderer.send('set-ignore-mouse', v),
  toggleAlwaysOnTop: ()      => ipcRenderer.send('toggle-always-on-top'),
  snapWindow:        ()      => ipcRenderer.send('snap-window'),
  openExternal:      (url)   => ipcRenderer.send('open-external', url),
  onAlwaysOnTopChanged: (cb) => ipcRenderer.on('always-on-top-changed', (_, v) => cb(v)),
  saveData:          (json)  => ipcRenderer.invoke('save-data', json),
  loadData:          ()      => ipcRenderer.invoke('load-data'),
  readClaudeUsage:   ()      => ipcRenderer.invoke('read-claude-usage'),
  captureBoard:      ()      => ipcRenderer.invoke('capture-board')
})

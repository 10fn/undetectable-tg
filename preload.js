const { contextBridge, ipcRenderer } = require('electron')

// Экспонируем безопасные методы в рендерер
contextBridge.exposeInMainWorld('electronAPI', {
	sendMessage: (channel, data) => {
		ipcRenderer.send(channel, data)
	},
	onMessage: (channel, func) => {
		ipcRenderer.on(channel, (event, ...args) => func(...args))
	},
})

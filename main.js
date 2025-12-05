const {
	app,
	BrowserWindow,
	globalShortcut,
	systemPreferences,
} = require('electron')
const path = require('path')

let overlayWindow = null
let isOverlayVisible = true

function requestPermissions() {
	systemPreferences.askForMediaAccess('screen')

	if (process.platform === 'darwin') {
		const accessibility = systemPreferences.isTrustedAccessibilityClient(false)
		if (!accessibility) {
			console.log(
				'Требуется включить доступ к специальным возможностям в настройках macOS'
			)
		}
	}
}

function createOverlayWindow() {
	const width = 400
	const height = 750

	const { screen } = require('electron')
	const primaryDisplay = screen.getPrimaryDisplay()
	const { width: screenWidth } = primaryDisplay.workAreaSize

	const x = screenWidth - width - 20
	const y = 50

	overlayWindow = new BrowserWindow({
		width: width,
		height: height,
		x: x,
		y: y,

		ignoreMouseEvents: false,

		webPreferences: {
			nodeIntegration: false,
			contextIsolation: false,
			enableRemoteModule: true,
		},
	})

	// Загружаем Telegram Web
	overlayWindow.loadURL('https://web.telegram.org/k/')

	overlayWindow.setOpacity(0.9)

	// Защита от захвата экрана
	overlayWindow.setContentProtection(true)
	overlayWindow.setVisibleOnAllWorkspaces(true, {
		visibleOnFullScreen: true,
		skipTransformProcessType: true,
	})

	overlayWindow.setAlwaysOnTop(true, 'screen-saver')
	overlayWindow.setSkipTaskbar(true)

	// Отладка
	// overlayWindow.webContents.openDevTools({ mode: 'detach' })
}

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		show: true,
		// transparent: true,
		// backgroundColor: '#80000000',
		opacity: 0.5,
		webPreferences: {
			nodeIntegration: true,
		},
	})

	mainWindow.loadFile('index.html')
	mainWindow.hide()
}

// Горячие клавиши
function registerGlobalShortcuts() {
	// Показать/скрыть
	globalShortcut.register('CommandOrControl+Shift+T', () => {
		if (overlayWindow) {
			if (isOverlayVisible) {
				overlayWindow.hide()
			} else {
				overlayWindow.show()
				overlayWindow.setAlwaysOnTop(true, 'screen-saver')
			}
			isOverlayVisible = !isOverlayVisible
		}
	})

	// Перемещение
	globalShortcut.register('CommandOrControl+Shift+M', () => {
		if (overlayWindow) {
			const { screen } = require('electron')
			const primaryDisplay = screen.getPrimaryDisplay()
			const { width: screenWidth } = primaryDisplay.workAreaSize

			const bounds = overlayWindow.getBounds()
			const newX =
				bounds.x < screenWidth / 2 ? screenWidth - bounds.width - 20 : 20
			overlayWindow.setPosition(newX, bounds.y)
		}
	})

	// Изменение прозрачности окна
	globalShortcut.register('CommandOrControl+Shift+Up', () => {
		if (overlayWindow) {
			const currentOpacity = overlayWindow.getOpacity()
			const newOpacity = Math.min(1, currentOpacity + 0.1)
			overlayWindow.setOpacity(newOpacity)
		}
	})

	globalShortcut.register('CommandOrControl+Shift+Down', () => {
		if (overlayWindow) {
			const currentOpacity = overlayWindow.getOpacity()
			const newOpacity = Math.max(0.1, currentOpacity - 0.1)
			overlayWindow.setOpacity(newOpacity)
		}
	})
}

app.whenReady().then(() => {
	requestPermissions()
	createMainWindow()
	createOverlayWindow()
	registerGlobalShortcuts()
	app.dock.hide()

	console.log('Приложение запущено!')
	console.log('Горячие клавиши:')
	console.log('  Cmd+Shift+T - показать/скрыть')
	console.log('  Cmd+Shift+M - переместить')
	console.log('  Cmd+Shift+↑/↓ - изменить прозрачность')
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createOverlayWindow()
	}
})

app.on('will-quit', () => {
	globalShortcut.unregisterAll()
})

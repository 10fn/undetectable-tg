const {
	app,
	BrowserWindow,
	globalShortcut,
	systemPreferences,
} = require('electron')

let overlayWindow = null
let isOverlayVisible = true

function requestPermissions() {
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

	overlayWindow.loadURL('https://web.telegram.org/k/')

	overlayWindow.setOpacity(0.8)
	// Всегда дефолтный курсор
	overlayWindow.webContents.on('did-finish-load', () => {
		overlayWindow.webContents.insertCSS(`
            * {
                cursor: default !important;
            }
            
            a, button, input, textarea, select, 
            [role="button"], [onclick], [tabindex] {
                cursor: default !important;
            }
            
            body {
                cursor: default !important;
            }
        `)
	})

	overlayWindow.setContentProtection(true)
	overlayWindow.setVisibleOnAllWorkspaces(true, {
		visibleOnFullScreen: true,
		skipTransformProcessType: true,
	})

	overlayWindow.setAlwaysOnTop(true, 'screen-saver')
	overlayWindow.setSkipTaskbar(true)

	overlayWindow.on('close', () => {
		app.quit()
	})

	// Отладка
	// overlayWindow.webContents.openDevTools({ mode: 'detach' })
}

// Горячие клавиши
function registerGlobalShortcuts() {
	// Показать/скрыть
	globalShortcut.register('CommandOrControl+Shift+H', () => {
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
	createOverlayWindow()
	registerGlobalShortcuts()
	app.dock?.hide() // для mac

	console.log('Приложение запущено!')
	console.log('Горячие клавиши:')
	console.log('  Cmd+Shift+H - показать/скрыть')
	console.log('  Cmd+Shift+M - переместить')
	console.log('  Cmd+Shift+↑/↓ - изменить прозрачность')
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createOverlayWindow()
	}
})

app.on('will-quit', () => {
	globalShortcut.unregisterAll()
})

app.on('close', () => {
	app.quit()
})

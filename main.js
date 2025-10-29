const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
    const mainWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            autoplayPolicy: 'no-user-gesture-required'
        },
        title: 'In To The Woods'
    });


    mainWindow.setMenuBarVisibility(false);

    // โหลด index.html จาก dist (หลัง npm run build)
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    mainWindow.loadURL(
        url.format({
            pathname: indexPath,
            protocol: 'file:',
            slashes: true,
        })
    );

    // ESC เพื่อออกจากเกม
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') {
            event.preventDefault();  
            app.quit();
        }
    });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

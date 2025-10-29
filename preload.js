const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {

    send: (channel, data) => {
        const validChannels = ['to-main', 'close-app']; 
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    on: (channel, func) => {
        const validChannels = ['from-main']; 
        if (validChannels.includes(channel)) {
            // ipcRenderer.on(channel, (event, ...args) => func(...args));
            
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => ipcRenderer.removeListener(channel, subscription);
        }
    }
});
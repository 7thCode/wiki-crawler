const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  startCrawl: (config) => ipcRenderer.invoke('start-crawl', config),
  stopCrawl: () => ipcRenderer.invoke('stop-crawl'),
  getCategories: (language) => ipcRenderer.invoke('get-categories', language),
  onCrawlProgress: (callback) => {
    ipcRenderer.on('crawl-progress', (event, progress) => callback(progress));
  }
});

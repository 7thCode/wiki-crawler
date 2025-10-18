const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const WikipediaCrawler = require('./crawler');
const FileManager = require('./fileManager');

let mainWindow;
let crawler;
let fileManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  crawler = new WikipediaCrawler();
  fileManager = new FileManager();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('start-crawl', async (event, config) => {
  try {
    const articles = await crawler.crawl(config, (progress) => {
      mainWindow.webContents.send('crawl-progress', progress);
    });

    await fileManager.saveArticles(articles, config);

    return { success: true, count: articles.length };
  } catch (error) {
    console.error('Crawl error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-crawl', async () => {
  crawler.stop();
  return { success: true };
});

ipcMain.handle('get-categories', async (event, language) => {
  try {
    const categories = await crawler.getPopularCategories(language);
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

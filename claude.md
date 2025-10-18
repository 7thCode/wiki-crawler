# Wikipedia Theme Crawler - Project Guide

## Project Overview

Electron-based desktop application for crawling and organizing Wikipedia content by themes. Downloads articles in multiple formats (Markdown, HTML, JSON) with support for images and various collection modes.

## Architecture

```
wiki-crawler/
├── src/
│   ├── main/                # Electron main process
│   │   ├── main.js          # App entry point, window management
│   │   ├── crawler.js       # Wikipedia API integration, crawling logic
│   │   ├── fileManager.js   # File I/O operations, metadata handling
│   │   └── preload.js       # IPC bridge (main ↔ renderer)
│   ├── renderer/            # Electron renderer process (UI)
│   │   ├── index.html       # Application UI structure
│   │   ├── renderer.js      # UI logic, IPC communication
│   │   └── styles.css       # Application styling
│   └── shared/              # Shared utilities (currently empty)
├── data/                    # Default output directory
└── node_modules/            # Dependencies
```

## Tech Stack

- **Framework**: Electron 28.0.0
- **HTTP Client**: Axios 1.6.0
- **HTML→Markdown**: Turndown 7.1.2
- **Build Tool**: electron-builder 24.9.0
- **Language**: JavaScript (Node.js/Browser)

## Core Components

### 1. WikipediaCrawler (`src/main/crawler.js`)

Main crawling engine with 4 collection modes:

#### Collection Modes
- **category**: Fetch articles from Wikipedia category
  - API: `action=query&list=categorymembers`
  - Pagination: cmcontinue token
  - Max 500 articles per request

- **search**: Keyword-based article search
  - API: `action=query&list=search`
  - Max 500 results per request

- **links**: Follow article links recursively
  - API: `action=query&prop=links`
  - BFS traversal with configurable depth (1-3)
  - Limits to 10 links per page

- **manual**: User-provided article title list
  - Input: newline-separated titles

#### Key Methods
```javascript
crawl(config, progressCallback)        // Main orchestration
getArticlesFromCategory(baseURL, category, maxArticles)
searchArticles(baseURL, query, maxArticles)
getArticlesFromLinks(baseURL, startTitle, maxArticles, depth)
fetchArticle(baseURL, title, includeImages)  // Get article content
stop()                                  // Graceful cancellation
```

#### Rate Limiting
- 200ms delay between requests (Wikipedia etiquette)
- User-Agent header compliance
- Respects API continuation tokens

### 2. FileManager (`src/main/fileManager.js`)

Handles all file I/O operations:
- Save articles in Markdown/HTML/JSON format
- Download and store images
- Generate INDEX.md (article listing)
- Create metadata.json (crawl metadata)
- Manage directory structure

Expected output structure:
```
output_directory/
└── theme_name/
    ├── metadata.json          # Crawl info, timestamps
    ├── INDEX.md               # Article index
    ├── article_1.md           # Individual articles
    ├── article_2.md
    └── images/                # Optional image directory
        ├── article_1.jpg
        └── article_2.jpg
```

### 3. Main Process (`src/main/main.js`)

- Electron BrowserWindow management
- IPC handler registration
- Application lifecycle
- DevTools control (--dev flag)

### 4. Renderer Process (`src/renderer/renderer.js`)

UI logic and IPC communication:
- Form validation
- Progress bar updates
- Error handling and display
- Directory selection dialog

## Wikipedia API Integration

### Base URL Pattern
```javascript
https://{language}.wikipedia.org/w/api.php
```

### Supported Languages
- `ja`: Japanese
- `en`: English
- (extensible to other language codes)

### API Parameters
```javascript
{
  action: 'query',
  format: 'json',
  // Mode-specific parameters
  prop: 'extracts|pageimages',
  explaintext: false,
  exsectionformat: 'wiki',
  piprop: 'original'
}
```

## IPC Communication

Main ↔ Renderer channels:

```javascript
// Renderer → Main
'start-crawl'        // Config object
'stop-crawl'         // Stop current operation
'select-directory'   // Open directory picker

// Main → Renderer
'crawl-progress'     // { current, total, title, status }
'crawl-complete'     // { success, message, articleCount }
'crawl-error'        // { error }
```

## Configuration Object

```javascript
{
  language: 'ja' | 'en',           // Wikipedia language
  mode: 'category' | 'search' | 'links' | 'manual',
  query: string,                   // Mode-specific input
  maxArticles: 1-1000,             // Article limit
  format: 'markdown' | 'html' | 'json',
  includeImages: boolean,
  linkDepth: 1-3,                  // links mode only
  themeName: string,               // Output folder name
  outputDir: string                // Base output directory
}
```

## Development Commands

```bash
npm start              # Launch app (production mode)
npm run dev            # Launch with DevTools
npm run build          # Build for all platforms
npm run build:mac      # macOS DMG
npm run build:win      # Windows NSIS installer
npm run build:linux    # Linux AppImage
```

## Code Patterns

### Error Handling
```javascript
try {
  // Wikipedia API calls
} catch (error) {
  console.error('Crawl error:', error);
  throw error;  // Propagate to IPC handler
}
```

### Progress Callbacks
```javascript
progressCallback({
  current: i + 1,
  total: titles.length,
  title: currentTitle,
  status: 'fetching' | 'completed' | 'error'
});
```

### Async/Await Pattern
All API calls use async/await consistently:
```javascript
async crawl(config, progressCallback) {
  const titles = await this.getArticlesFromCategory(...);
  for (const title of titles) {
    const article = await this.fetchArticle(...);
    await this.sleep(200);  // Rate limiting
  }
}
```

## Known Limitations & Considerations

1. **Rate Limiting**: 200ms per request = ~5 articles/sec max
2. **Memory**: Large crawls (>1000 articles) keep all data in memory
3. **Error Recovery**: No retry logic for failed API calls
4. **Partial Results**: If stopped mid-crawl, no articles are saved
5. **Link Depth**: Exponential growth - depth 3 can fetch many articles

## Testing Strategy

Currently no automated tests. Manual testing checklist:
- [ ] Each collection mode (category, search, links, manual)
- [ ] Multiple languages (ja, en)
- [ ] All output formats (markdown, html, json)
- [ ] Image download option
- [ ] Stop functionality
- [ ] Error handling (invalid category, network failure)
- [ ] Progress bar accuracy

## Future Enhancement Ideas

- [ ] Cache API responses to avoid re-fetching
- [ ] Resume interrupted crawls
- [ ] Export to SQLite/database
- [ ] Multi-threaded downloading (respect rate limits)
- [ ] Article deduplication
- [ ] Better error recovery (retry logic)
- [ ] Unit tests for crawler.js
- [ ] E2E tests with Playwright

## Wikipedia API Resources

- [MediaWiki API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
- [API Etiquette](https://www.mediawiki.org/wiki/API:Etiquette)
- [Wikipedia Dumps](https://dumps.wikimedia.org/) - For bulk data
- [Terms of Use](https://foundation.wikimedia.org/wiki/Terms_of_Use)
- [CC BY-SA 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/)

## Common Development Tasks

### Adding a New Collection Mode

1. Add mode logic to `crawler.js`:
   ```javascript
   else if (mode === 'newmode') {
     titles = await this.getArticlesFromNewMode(baseURL, query, maxArticles);
   }
   ```

2. Implement the method:
   ```javascript
   async getArticlesFromNewMode(baseURL, query, maxArticles) {
     // Wikipedia API call
     // Return array of article titles
   }
   ```

3. Update UI in `renderer/index.html` and `renderer.js`

### Adding a New Output Format

1. Extend `fileManager.js`:
   ```javascript
   if (format === 'newformat') {
     // Convert article content to new format
     // Save with appropriate extension
   }
   ```

2. Update format selection in UI

### Adding a New Language

1. Add language code to UI dropdown (`renderer/index.html`)
2. Optionally add popular categories in `crawler.js` `getPopularCategories()`

## Debugging Tips

- Use `npm run dev` for DevTools access
- Check Network tab for Wikipedia API responses
- Console logs in main process: check terminal output
- Console logs in renderer: check DevTools console
- IPC issues: Add logging in both preload.js and handlers

## Performance Optimization Opportunities

1. **Batch API Requests**: Some endpoints support multiple titles
2. **Parallel Downloads**: Respect rate limits but parallelize where possible
3. **Stream Writing**: For large crawls, stream to disk instead of memory
4. **Image Optimization**: Compress/resize images before saving
5. **Incremental Saves**: Save articles as they're fetched, not at the end

---

**Last Updated**: 2025-10-18
**Electron Version**: 28.0.0
**Node.js Requirement**: v16+

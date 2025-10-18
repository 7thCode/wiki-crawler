// DOM Elements
const languageSelect = document.getElementById('language');
const modeSelect = document.getElementById('mode');
const queryInput = document.getElementById('query');
const queryLabel = document.getElementById('queryLabel');
const queryGroup = document.getElementById('queryGroup');
const linkDepthGroup = document.getElementById('linkDepthGroup');
const linkDepthInput = document.getElementById('linkDepth');
const maxArticlesInput = document.getElementById('maxArticles');
const formatSelect = document.getElementById('format');
const includeImagesCheckbox = document.getElementById('includeImages');
const themeInput = document.getElementById('theme');
const outputDirectoryInput = document.getElementById('outputDirectory');
const selectDirBtn = document.getElementById('selectDirBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const currentArticle = document.getElementById('currentArticle');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const categoryHelp = document.getElementById('categoryHelp');

let isCrawling = false;

// Mode change handler
modeSelect.addEventListener('change', () => {
  const mode = modeSelect.value;

  switch(mode) {
    case 'category':
      queryLabel.textContent = 'カテゴリ名';
      queryInput.placeholder = '例: 日本の歴史';
      categoryHelp.textContent = 'カテゴリ名を入力 (例: 日本の歴史, 物理学)';
      linkDepthGroup.style.display = 'none';
      queryGroup.style.display = 'block';
      queryInput.type = 'text';
      break;
    case 'search':
      queryLabel.textContent = '検索キーワード';
      queryInput.placeholder = '例: 量子力学';
      categoryHelp.textContent = '検索したいキーワードを入力';
      linkDepthGroup.style.display = 'none';
      queryGroup.style.display = 'block';
      queryInput.type = 'text';
      break;
    case 'links':
      queryLabel.textContent = '開始記事名';
      queryInput.placeholder = '例: 東京';
      categoryHelp.textContent = 'リンクを辿る起点となる記事名を入力';
      linkDepthGroup.style.display = 'block';
      queryGroup.style.display = 'block';
      queryInput.type = 'text';
      break;
    case 'manual':
      queryLabel.textContent = '記事リスト (1行1記事)';
      categoryHelp.textContent = '収集したい記事のタイトルを1行ごとに入力';
      linkDepthGroup.style.display = 'none';
      queryGroup.style.display = 'block';
      queryInput.type = 'text';
      break;
  }
});

// Directory selection
selectDirBtn.addEventListener('click', async () => {
  const directory = await window.electronAPI.selectOutputDirectory();
  if (directory) {
    outputDirectoryInput.value = directory;
  }
});

// Start crawling
startBtn.addEventListener('click', async () => {
  // Validation
  if (!queryInput.value.trim()) {
    alert('クエリを入力してください');
    return;
  }

  if (!themeInput.value.trim()) {
    alert('テーマ名を入力してください');
    return;
  }

  if (!outputDirectoryInput.value) {
    alert('出力ディレクトリを選択してください');
    return;
  }

  const config = {
    language: languageSelect.value,
    mode: modeSelect.value,
    query: queryInput.value.trim(),
    linkDepth: parseInt(linkDepthInput.value),
    maxArticles: parseInt(maxArticlesInput.value),
    format: formatSelect.value,
    includeImages: includeImagesCheckbox.checked,
    theme: themeInput.value.trim(),
    outputDirectory: outputDirectoryInput.value
  };

  // Start crawling
  isCrawling = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  progressSection.style.display = 'block';
  resultSection.style.display = 'none';

  const result = await window.electronAPI.startCrawl(config);

  isCrawling = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (result.success) {
    resultSection.style.display = 'block';
    resultText.textContent = `✅ クロール完了！${result.count}件の記事を保存しました。\n出力先: ${config.outputDirectory}/${config.theme}`;
  } else {
    resultSection.style.display = 'block';
    resultText.textContent = `❌ エラーが発生しました: ${result.error}`;
  }
});

// Stop crawling
stopBtn.addEventListener('click', async () => {
  await window.electronAPI.stopCrawl();
  stopBtn.disabled = true;
});

// Progress updates
window.electronAPI.onCrawlProgress((progress) => {
  if (progress.status === 'fetching') {
    const percentage = (progress.current / progress.total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${progress.current} / ${progress.total}`;
    currentArticle.textContent = `取得中: ${progress.title}`;
  } else if (progress.status === 'completed') {
    progressFill.style.width = '100%';
    progressText.textContent = `完了: ${progress.total} / ${progress.total}`;
    currentArticle.textContent = '';
  }
});

// Auto-fill theme from query
queryInput.addEventListener('blur', () => {
  if (!themeInput.value && queryInput.value) {
    themeInput.value = queryInput.value.replace(/[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
  }
});

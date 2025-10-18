const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class FileManager {
  constructor() {
    this.outputDir = null;
  }

  async saveArticles(articles, config) {
    const { outputDirectory, format, includeImages, theme } = config;
    this.outputDir = outputDirectory;

    // Create theme directory
    const themeDir = path.join(outputDirectory, this.sanitizeFilename(theme));
    await this.ensureDir(themeDir);

    // Save metadata
    const metadata = {
      theme: theme,
      totalArticles: articles.length,
      crawledAt: new Date().toISOString(),
      config: config
    };

    await fs.writeFile(
      path.join(themeDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Save articles
    for (const article of articles) {
      await this.saveArticle(article, themeDir, format, includeImages);
    }

    // Create index file
    await this.createIndex(articles, themeDir);
  }

  async saveArticle(article, themeDir, format, includeImages) {
    const filename = this.sanitizeFilename(article.title);
    let content = '';

    if (format === 'markdown') {
      content = this.formatMarkdown(article);
      await fs.writeFile(
        path.join(themeDir, `${filename}.md`),
        content,
        'utf-8'
      );
    } else if (format === 'json') {
      await fs.writeFile(
        path.join(themeDir, `${filename}.json`),
        JSON.stringify(article, null, 2),
        'utf-8'
      );
    } else if (format === 'html') {
      content = this.formatHTML(article);
      await fs.writeFile(
        path.join(themeDir, `${filename}.html`),
        content,
        'utf-8'
      );
    }

    // Download image if requested
    if (includeImages && article.image) {
      await this.downloadImage(article.image, themeDir, filename);
    }
  }

  formatMarkdown(article) {
    let md = `# ${article.title}\n\n`;
    md += `**URL**: [${article.url}](${article.url})\n`;
    md += `**Crawled**: ${article.timestamp}\n\n`;

    if (article.image) {
      const imageName = `${this.sanitizeFilename(article.title)}.jpg`;
      md += `![${article.title}](./images/${imageName})\n\n`;
    }

    md += `---\n\n`;
    md += article.content;

    return md;
  }

  formatHTML(article) {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(article.title)}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
    }
    h1 { color: #333; }
    .meta { color: #666; font-size: 0.9em; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>${this.escapeHTML(article.title)}</h1>
  <div class="meta">
    <p><strong>URL:</strong> <a href="${article.url}">${article.url}</a></p>
    <p><strong>Crawled:</strong> ${article.timestamp}</p>
  </div>
  ${article.image ? `<img src="./images/${this.sanitizeFilename(article.title)}.jpg" alt="${this.escapeHTML(article.title)}">` : ''}
  <hr>
  <div class="content">
    ${article.content}
  </div>
</body>
</html>`;
  }

  async createIndex(articles, themeDir) {
    let indexContent = '# Article Index\n\n';
    indexContent += `Total Articles: ${articles.length}\n\n`;

    articles.forEach((article, i) => {
      const filename = this.sanitizeFilename(article.title);
      indexContent += `${i + 1}. [${article.title}](./${filename}.md)\n`;
    });

    await fs.writeFile(
      path.join(themeDir, 'INDEX.md'),
      indexContent,
      'utf-8'
    );
  }

  async downloadImage(imageUrl, themeDir, filename) {
    try {
      const imagesDir = path.join(themeDir, 'images');
      await this.ensureDir(imagesDir);

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const imagePath = path.join(imagesDir, `${filename}${ext}`);

      await fs.writeFile(imagePath, response.data);
    } catch (error) {
      console.error(`Failed to download image: ${imageUrl}`, error);
    }
  }

  async ensureDir(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = FileManager;

const axios = require('axios');
const TurndownService = require('turndown');

class WikipediaCrawler {
  constructor() {
    this.stopped = false;
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
  }

  async crawl(config, progressCallback) {
    this.stopped = false;
    const articles = [];
    const { language, mode, query, maxArticles, includeImages } = config;

    const baseURL = `https://${language}.wikipedia.org/w/api.php`;

    try {
      let titles = [];

      if (mode === 'category') {
        titles = await this.getArticlesFromCategory(baseURL, query, maxArticles);
      } else if (mode === 'search') {
        titles = await this.searchArticles(baseURL, query, maxArticles);
      } else if (mode === 'links') {
        titles = await this.getArticlesFromLinks(baseURL, query, maxArticles, config.linkDepth || 1);
      } else if (mode === 'manual') {
        titles = query.split('\n').filter(t => t.trim());
      }

      for (let i = 0; i < titles.length; i++) {
        if (this.stopped) break;

        const title = titles[i];
        progressCallback({
          current: i + 1,
          total: titles.length,
          title: title,
          status: 'fetching'
        });

        const article = await this.fetchArticle(baseURL, title, includeImages);
        if (article) {
          articles.push(article);
        }

        // Rate limiting: 200ms between requests (Wikipedia etiquette)
        await this.sleep(200);
      }

      progressCallback({
        current: titles.length,
        total: titles.length,
        status: 'completed'
      });

      return articles;
    } catch (error) {
      console.error('Crawl error:', error);
      throw error;
    }
  }

  async getArticlesFromCategory(baseURL, category, maxArticles) {
    const titles = [];
    let cmcontinue = null;

    while (titles.length < maxArticles) {
      const params = {
        action: 'query',
        list: 'categorymembers',
        cmtitle: category.startsWith('Category:') ? category : `Category:${category}`,
        cmlimit: Math.min(500, maxArticles - titles.length),
        cmtype: 'page',
        format: 'json'
      };

      if (cmcontinue) {
        params.cmcontinue = cmcontinue;
      }

      const response = await axios.get(baseURL, { params });
      const members = response.data.query.categorymembers;

      titles.push(...members.map(m => m.title));

      if (!response.data.continue || this.stopped) break;
      cmcontinue = response.data.continue.cmcontinue;
    }

    return titles.slice(0, maxArticles);
  }

  async searchArticles(baseURL, query, maxArticles) {
    const params = {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: Math.min(500, maxArticles),
      format: 'json'
    };

    const response = await axios.get(baseURL, { params });
    return response.data.query.search.map(s => s.title);
  }

  async getArticlesFromLinks(baseURL, startTitle, maxArticles, depth) {
    const visited = new Set();
    const queue = [{ title: startTitle, depth: 0 }];
    const titles = [];

    while (queue.length > 0 && titles.length < maxArticles) {
      if (this.stopped) break;

      const { title, depth: currentDepth } = queue.shift();

      if (visited.has(title) || currentDepth > depth) continue;
      visited.add(title);
      titles.push(title);

      if (currentDepth < depth) {
        const links = await this.getPageLinks(baseURL, title);
        for (const link of links.slice(0, 10)) {
          if (!visited.has(link)) {
            queue.push({ title: link, depth: currentDepth + 1 });
          }
        }
      }
    }

    return titles.slice(0, maxArticles);
  }

  async getPageLinks(baseURL, title) {
    const params = {
      action: 'query',
      titles: title,
      prop: 'links',
      pllimit: 50,
      plnamespace: 0,
      format: 'json'
    };

    const response = await axios.get(baseURL, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pages[pageId].links) {
      return pages[pageId].links.map(l => l.title);
    }

    return [];
  }

  async fetchArticle(baseURL, title, includeImages) {
    const params = {
      action: 'query',
      titles: title,
      prop: 'extracts|pageimages',
      explaintext: false,
      exsectionformat: 'wiki',
      piprop: 'original',
      format: 'json'
    };

    const response = await axios.get(baseURL, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === '-1' || !page.extract) {
      return null;
    }

    const article = {
      title: page.title,
      pageId: pageId,
      url: `${baseURL.replace('/w/api.php', '')}/wiki/${encodeURIComponent(title)}`,
      content: this.turndownService.turndown(page.extract),
      timestamp: new Date().toISOString()
    };

    if (includeImages && page.original) {
      article.image = page.original.source;
    }

    return article;
  }

  async getPopularCategories(language) {
    const baseURL = `https://${language}.wikipedia.org/w/api.php`;

    // Predefined popular categories by language
    const popularCategories = {
      ja: [
        'Category:日本の歴史',
        'Category:科学',
        'Category:技術',
        'Category:数学',
        'Category:物理学',
        'Category:化学',
        'Category:生物学',
        'Category:地理',
        'Category:文学',
        'Category:哲学'
      ],
      en: [
        'Category:History',
        'Category:Science',
        'Category:Technology',
        'Category:Mathematics',
        'Category:Physics',
        'Category:Chemistry',
        'Category:Biology',
        'Category:Geography',
        'Category:Literature',
        'Category:Philosophy'
      ]
    };

    return popularCategories[language] || popularCategories.en;
  }

  stop() {
    this.stopped = true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WikipediaCrawler;

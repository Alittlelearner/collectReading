"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SspaiExtractor = void 0;
const network_1 = require("../network");
class SspaiExtractor {
    constructor() {
        this.id = 'sspai';
        this.displayName = '少数派';
        this.pattern = /sspai\.com\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 60;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        const articleId = this.extractArticleId(url);
        if (articleId) {
            try {
                const json = await (0, network_1.fetchJsonWithTimeout)(`https://sspai.com/api/v1/article/info/get?id=${encodeURIComponent(articleId)}`, {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'Mozilla/5.0',
                    },
                }, 8000);
                const article = json?.data;
                if (article) {
                    return {
                        title: article.title || '',
                        description: article.summary || this.extractSummaryFromBody(article.body || ''),
                        imageUrl: article.banner
                            ? `https://cdnfile.sspai.com/${article.banner}`
                            : this.extractImageFromBody(article.body || ''),
                        author: article.author?.nickname || article.author?.username || null,
                        sourceType: 'website',
                        sourceDomain,
                        originalTags: this.extractTags(article),
                        publishedAt: this.toMillis(article.released_at || article.created_at || article.modify_at),
                    };
                }
            }
            catch { }
        }
        const html = context.html || '';
        return {
            title: this.extractTitle(html),
            description: this.extractDescription(html),
            imageUrl: this.extractImage(html),
            author: this.extractAuthor(html),
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractArticleId(url) {
        const match = url.match(/\/post\/(\d+)/);
        return match ? match[1] : null;
    }
    extractTitle(html) {
        const ogTitle = this.extractMeta(html, 'og:title');
        if (ogTitle)
            return ogTitle.replace(/\s*-\s*少数派$/, '').trim();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1].replace(/\s*-\s*少数派$/, '').trim() : '';
    }
    extractDescription(html) {
        return this.extractMeta(html, 'og:description') || this.extractMeta(html, 'description') || '';
    }
    extractImage(html) {
        return this.extractMeta(html, 'og:image');
    }
    extractAuthor(html) {
        return this.extractMeta(html, 'article:author');
    }
    extractSummaryFromBody(body) {
        return body
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 180);
    }
    extractImageFromBody(body) {
        const match = body.match(/<(?:img)[^>]+(?:data-original|src)=["']([^"']+)["']/i);
        return match ? match[1] : null;
    }
    extractTags(article) {
        const tags = article?.keywords || article?.tags || [];
        if (!Array.isArray(tags)) {
            return [];
        }
        return tags.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? match[1] : null;
    }
    toMillis(value) {
        if (typeof value !== 'number') {
            return null;
        }
        return value > 1000000000000 ? value : value * 1000;
    }
}
exports.SspaiExtractor = SspaiExtractor;

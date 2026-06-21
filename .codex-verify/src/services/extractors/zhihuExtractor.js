"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZhihuExtractor = void 0;
const network_1 = require("../network");
const media_1 = require("../../utils/media");
const MOBILE_ZHIHU_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
class ZhihuExtractor {
    constructor() {
        this.id = 'zhihu';
        this.displayName = '知乎';
        this.pattern = /zhihu\.com\//;
        this.sourceType = 'zhihu';
        this.needsHTML = true;
        this.priority = 80;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        const html = await this.getBestHtml(url, context.html || '');
        const state = this.extractState(html);
        const stateMetadata = this.extractFromState(state, url, sourceDomain);
        return {
            title: stateMetadata.title || this.extractMeta(html, 'og:title') || this.extractTag(html, 'title'),
            description: stateMetadata.description ||
                this.extractMeta(html, 'og:description') ||
                this.extractMeta(html, 'description') ||
                '',
            imageUrl: (0, media_1.normalizeImageUrl)(stateMetadata.imageUrl || this.extractMeta(html, 'og:image')),
            author: stateMetadata.author || this.extractAuthor(html),
            sourceType: 'zhihu',
            sourceDomain,
            originalTags: stateMetadata.originalTags,
            publishedAt: stateMetadata.publishedAt,
        };
    }
    async getBestHtml(url, html) {
        if (this.hasUsefulState(html)) {
            return html;
        }
        const mobileUrl = this.toMobileUrl(url);
        try {
            const mobileHtml = await (0, network_1.fetchTextWithTimeout)(mobileUrl, {
                headers: {
                    'User-Agent': MOBILE_ZHIHU_UA,
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            }, 8000);
            return this.hasUsefulState(mobileHtml) ? mobileHtml : html;
        }
        catch {
            return html;
        }
    }
    toMobileUrl(url) {
        try {
            const parsed = new URL(url);
            parsed.hostname = 'm.zhihu.com';
            return parsed.toString();
        }
        catch {
            return url;
        }
    }
    hasUsefulState(html) {
        return html.includes('initialState') || html.includes('"entities"');
    }
    extractState(html) {
        const marker = '"initialState":';
        const start = html.indexOf(marker);
        if (start === -1) {
            return null;
        }
        const from = start + marker.length;
        const end = html.indexOf(',"subAppName"', from);
        if (end === -1) {
            return null;
        }
        try {
            return JSON.parse(html.slice(from, end));
        }
        catch {
            return null;
        }
    }
    extractFromState(state, url, sourceDomain) {
        const empty = this.emptyResult(sourceDomain);
        if (!state) {
            return empty;
        }
        const answerId = this.extractAnswerId(url);
        if (answerId) {
            const answer = this.findById(state, 'answers', answerId);
            if (answer) {
                return {
                    title: answer.question?.title || answer.title || '',
                    description: this.cleanText(answer.excerpt || answer.summary || ''),
                    imageUrl: answer.thumbnail || answer.cover || answer.question?.thumbnail || null,
                    author: answer.author?.name || null,
                    sourceType: 'zhihu',
                    sourceDomain,
                    originalTags: [],
                    publishedAt: this.toMillis(answer.created_time || answer.updated_time),
                };
            }
        }
        const questionId = this.extractQuestionId(url);
        if (questionId) {
            const question = this.findById(state, 'questions', questionId);
            if (question) {
                return {
                    title: question.title || '',
                    description: this.cleanText(question.excerpt || question.detail || ''),
                    imageUrl: question.thumbnail || question.cover || null,
                    author: question.author?.name || null,
                    sourceType: 'zhihu',
                    sourceDomain,
                    originalTags: Array.isArray(question.topics)
                        ? question.topics
                            .map((topic) => topic?.name)
                            .filter((name) => typeof name === 'string' && name.trim().length > 0)
                        : [],
                    publishedAt: this.toMillis(question.created || question.updated_time),
                };
            }
        }
        const articleId = this.extractArticleId(url);
        if (articleId) {
            const article = this.findById(state, 'articles', articleId);
            if (article) {
                return {
                    title: article.title || '',
                    description: this.cleanText(article.excerpt || article.summary || ''),
                    imageUrl: article.titleImage || article.image_url || article.cover || null,
                    author: article.author?.name || null,
                    sourceType: 'zhihu',
                    sourceDomain,
                    originalTags: [],
                    publishedAt: this.toMillis(article.created || article.updated),
                };
            }
        }
        return empty;
    }
    findById(state, collectionName, id) {
        const collection = state?.entities?.[collectionName];
        if (!collection || typeof collection !== 'object') {
            return null;
        }
        return collection[id] || collection[String(id)] || null;
    }
    extractQuestionId(url) {
        const match = url.match(/question\/(\d+)/);
        return match ? match[1] : null;
    }
    extractAnswerId(url) {
        const match = url.match(/answer\/(\d+)/);
        return match ? match[1] : null;
    }
    extractArticleId(url) {
        const match = url.match(/\/p\/(\d+)/);
        return match ? match[1] : null;
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? match[1] : null;
    }
    extractTag(html, tag) {
        const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
        return match ? match[1].trim() : '';
    }
    extractAuthor(html) {
        return this.extractMeta(html, 'article:author');
    }
    cleanText(value) {
        return value
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    toMillis(value) {
        if (typeof value !== 'number') {
            return null;
        }
        return value > 1000000000000 ? value : value * 1000;
    }
    emptyResult(sourceDomain) {
        return {
            title: '',
            description: '',
            imageUrl: null,
            author: null,
            sourceType: 'zhihu',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
}
exports.ZhihuExtractor = ZhihuExtractor;

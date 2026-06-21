"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JuejinExtractor = void 0;
const network_1 = require("../network");
class JuejinExtractor {
    constructor() {
        this.id = 'juejin';
        this.displayName = '掘金';
        this.pattern = /juejin\.cn\/post\//;
        this.sourceType = 'website';
        this.needsHTML = false;
        this.priority = 90;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        try {
            const articleId = this.extractArticleId(url);
            if (!articleId)
                return this.emptyResult(url, sourceDomain);
            const response = await (0, network_1.fetchWithTimeout)('https://api.juejin.cn/content_api/v1/article/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ article_id: articleId }),
            }, 5000);
            const json = await response.json();
            if (json.err_no !== 0 || !json.data?.article_info) {
                return this.emptyResult(url, sourceDomain);
            }
            const article = json.data.article_info;
            return {
                title: article.title || '',
                description: article.brief_content || '',
                imageUrl: article.cover_image || null,
                author: article.author_user_info?.user_name || null,
                sourceType: 'website',
                sourceDomain,
                originalTags: this.extractTags(json.data),
                publishedAt: this.toMillis(article.ctime || article.mtime),
            };
        }
        catch {
            return this.emptyResult(url, sourceDomain);
        }
    }
    extractArticleId(url) {
        const match = url.match(/\/post\/(\d+)/);
        return match ? match[1] : null;
    }
    emptyResult(url, sourceDomain) {
        return {
            title: '',
            description: '',
            imageUrl: null,
            author: null,
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractTags(data) {
        const tags = data?.tags || data?.tag_list || [];
        if (!Array.isArray(tags))
            return [];
        return tags
            .map((tag) => tag?.tag_name || tag?.name)
            .filter((tag) => typeof tag === 'string' && tag.trim().length > 0);
    }
    toMillis(value) {
        if (typeof value !== 'number')
            return null;
        return value > 1000000000000 ? value : value * 1000;
    }
}
exports.JuejinExtractor = JuejinExtractor;

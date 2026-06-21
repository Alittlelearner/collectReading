"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class BlogExtractor {
    constructor() {
        this.id = 'blog';
        this.displayName = '博客文章';
        this.pattern = /ruanyifeng\.com\/blog\/|\/posts?\/|\/article\/|\/archives?\/|\/\d{4}\/\d{2}\//i;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 40;
    }
    canHandle(url) {
        try {
            const parsed = new URL(url);
            if (/ruanyifeng\.com$/i.test(parsed.hostname)) {
                return /\/blog\//i.test(parsed.pathname);
            }
            if (/medium\.com|bilibili\.com|zhihu\.com|juejin\.cn|github\.com|segmentfault\.com|36kr\.com/i.test(parsed.hostname)) {
                return false;
            }
            return (/\/posts?\//i.test(parsed.pathname) ||
                /\/article\//i.test(parsed.pathname) ||
                /\/archives?\//i.test(parsed.pathname) ||
                /\/\d{4}\/\d{2}\//.test(parsed.pathname));
        }
        catch {
            return false;
        }
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html);
        return {
            title: metadata.title,
            description: metadata.description,
            imageUrl: metadata.imageUrl,
            author: metadata.author,
            sourceType: 'website',
            sourceDomain,
            originalTags: metadata.originalTags.length > 0 ? metadata.originalTags : this.extractTags(html),
            publishedAt: metadata.publishedAt,
        };
    }
    extractTags(html) {
        const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.splitKeywords)(match[1].replace(/，/g, ',')) : [];
    }
}
exports.BlogExtractor = BlogExtractor;

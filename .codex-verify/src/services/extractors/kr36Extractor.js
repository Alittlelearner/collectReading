"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kr36Extractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class Kr36Extractor {
    constructor() {
        this.id = '36kr';
        this.displayName = '36Kr';
        this.pattern = /(?:36kr\.com|m\.36kr\.com)\/p\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 77;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['-36氪', ' - 36氪'],
        });
        return {
            title: base.title,
            description: base.description,
            imageUrl: base.imageUrl || this.extractCover(html),
            author: base.author || this.extractAuthor(html),
            sourceType: 'website',
            sourceDomain,
            originalTags: base.originalTags.length > 0 ? base.originalTags : this.extractTags(html),
            publishedAt: base.publishedAt || this.extractPublishedAt(html),
        };
    }
    extractAuthor(html) {
        const match = html.match(/"authorName"\s*:\s*"([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.decodeHtmlEntities)(match[1]) : null;
    }
    extractCover(html) {
        const match = html.match(/"cover"\s*:\s*"([^"]+)"/i);
        if (!match?.[1]) {
            return null;
        }
        const value = (0, articleMetadata_1.decodeHtmlEntities)(match[1]);
        return value.startsWith('//') ? `https:${value}` : value;
    }
    extractPublishedAt(html) {
        const match = html.match(/"publishTime"\s*:\s*(\d{10,13})/i);
        return match?.[1] ? (0, articleMetadata_1.parseDateValue)(Number(match[1])) : null;
    }
    extractTags(html) {
        const keywords = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
        return keywords?.[1] ? (0, articleMetadata_1.splitKeywords)((0, articleMetadata_1.decodeHtmlEntities)(keywords[1]).replace(/，/g, ',')) : [];
    }
}
exports.Kr36Extractor = Kr36Extractor;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoqExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class InfoqExtractor {
    constructor() {
        this.id = 'infoq';
        this.displayName = 'InfoQ';
        this.pattern = /infoq\.cn\/article\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 72;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['- InfoQ', ' - InfoQ'],
            authorSelectors: [
                /<div[^>]*class="[^"]*author[^"]*"[^>]*>[\s\S]*?<[^>]+class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i,
                /<span[^>]*class="[^"]*author[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
            ],
        });
        return {
            title: base.title,
            description: base.description,
            imageUrl: base.imageUrl,
            author: base.author || this.extractAuthor(html),
            sourceType: 'website',
            sourceDomain,
            originalTags: base.originalTags.length > 0 ? base.originalTags : this.extractTags(html),
            publishedAt: base.publishedAt || this.extractPublishedAt(html),
        };
    }
    extractAuthor(html) {
        const match = html.match(/"name":"([^"]+)","avatar":/i);
        return match?.[1] ? (0, articleMetadata_1.decodeHtmlEntities)(match[1]) : null;
    }
    extractTags(html) {
        const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.splitKeywords)((0, articleMetadata_1.decodeHtmlEntities)(match[1]).replace(/，/g, ',')) : [];
    }
    extractPublishedAt(html) {
        const match = html.match(/"publishTime"\s*:\s*"([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.parseDateValue)(match[1]) : null;
    }
}
exports.InfoqExtractor = InfoqExtractor;

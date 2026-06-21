"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class TwitterExtractor {
    constructor() {
        this.id = 'twitter';
        this.displayName = 'X';
        this.pattern = /(?:x\.com|twitter\.com)\/[^/]+\/status\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 37;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['/ X', ' on X', ' / X', ' / Twitter'],
        });
        return {
            title: metadata.title || (0, articleMetadata_1.extractTitleTag)(html),
            description: metadata.description || (0, articleMetadata_1.extractMeta)(html, 'og:description') || '',
            imageUrl: metadata.imageUrl,
            author: this.extractAuthor(html),
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: metadata.publishedAt,
        };
    }
    extractAuthor(html) {
        const title = (0, articleMetadata_1.extractTitleTag)(html);
        const match = title.match(/^(.+?)\s+\(@[^)]+\)\s+on\s+X/i);
        return match?.[1]?.trim() || null;
    }
}
exports.TwitterExtractor = TwitterExtractor;

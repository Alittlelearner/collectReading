"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class YoutubeExtractor {
    constructor() {
        this.id = 'youtube';
        this.displayName = 'YouTube';
        this.pattern = /(?:youtube\.com\/watch|youtu\.be\/)/;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 38;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['- YouTube', ' - YouTube'],
        });
        return {
            ...metadata,
            sourceType: 'website',
            sourceDomain,
        };
    }
}
exports.YoutubeExtractor = YoutubeExtractor;

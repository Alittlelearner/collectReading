"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CnblogsExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class CnblogsExtractor {
    constructor() {
        this.id = 'cnblogs';
        this.displayName = '博客园';
        this.pattern = /cnblogs\.com\/.+\/p\/.+\.html/;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 74;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['- 博客园', ' - 博客园'],
        });
        return {
            ...metadata,
            sourceType: 'website',
            sourceDomain,
        };
    }
}
exports.CnblogsExtractor = CnblogsExtractor;

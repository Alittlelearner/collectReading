"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsdnExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class CsdnExtractor {
    constructor() {
        this.id = 'csdn';
        this.displayName = 'CSDN';
        this.pattern = /blog\.csdn\.net\/.+\/article\/details\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 78;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['-CSDN博客', '_CSDN博客', '- CSDN博客'],
        });
        return {
            ...metadata,
            sourceType: 'website',
            sourceDomain,
        };
    }
}
exports.CsdnExtractor = CsdnExtractor;

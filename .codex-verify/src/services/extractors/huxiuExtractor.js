"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuxiuExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class HuxiuExtractor {
    constructor() {
        this.id = 'huxiu';
        this.displayName = '虎嗅';
        this.pattern = /huxiu\.com\/article\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 76;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const metadata = this.isWafPage(html)
            ? (0, articleMetadata_1.createEmptyArticleMetadata)()
            : (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
                titleSuffixes: ['-虎嗅网', '- 虎嗅网'],
            });
        return {
            ...metadata,
            sourceType: 'website',
            sourceDomain,
        };
    }
    isWafPage(html) {
        return html.includes('aliyun_waf') || html.includes('验证码') || html.includes('captcha');
    }
}
exports.HuxiuExtractor = HuxiuExtractor;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WoshipmExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class WoshipmExtractor {
    constructor() {
        this.id = 'woshipm';
        this.displayName = '人人都是产品经理';
        this.pattern = /woshipm\.com\/.+\.html/;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 71;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['| 人人都是产品经理', ' - 人人都是产品经理'],
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
        const match = html.match(/<div[^>]*class="author[^"]*"[^>]*>[\s\S]*?<a[^>]*class="[^"]*ui-captionStrong[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        return match?.[1] ? (0, articleMetadata_1.decodeHtmlEntities)(match[1].replace(/<[^>]+>/g, '').trim()) : null;
    }
    extractTags(html) {
        const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.splitKeywords)((0, articleMetadata_1.decodeHtmlEntities)(match[1]).replace(/，/g, ',')) : [];
    }
    extractPublishedAt(html) {
        const timeTag = html.match(/<time[^>]*datetime="([^"]+)"/i);
        if (timeTag?.[1]) {
            return (0, articleMetadata_1.parseDateValue)(timeTag[1]);
        }
        const looseTime = html.match(/<time[^>]*>([^<]+)<\/time>/i);
        return looseTime?.[1] ? (0, articleMetadata_1.parseDateValue)(looseTime[1]) : null;
    }
}
exports.WoshipmExtractor = WoshipmExtractor;

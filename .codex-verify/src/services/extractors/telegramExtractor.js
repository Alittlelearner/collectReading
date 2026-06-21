"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class TelegramExtractor {
    constructor() {
        this.id = 'telegram';
        this.displayName = 'Telegram';
        this.pattern = /t\.me\/[^/]+\/\d+/;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 39;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['| Telegram', ' - Telegram'],
        });
        return {
            title: this.extractMessageTitle(html) || base.title,
            description: this.extractMessageText(html) || base.description,
            imageUrl: base.imageUrl,
            author: this.extractChannelName(html) || base.author,
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: this.extractPublishedAt(html) || base.publishedAt,
        };
    }
    extractChannelName(html) {
        const match = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
        return match?.[1] ? (0, articleMetadata_1.decodeHtmlEntities)(match[1]) : null;
    }
    extractMessageTitle(html) {
        const match = html.match(/<div[^>]*class="tgme_widget_message_text"[^>]*>([\s\S]*?)<\/div>/i);
        if (!match?.[1]) {
            return null;
        }
        const text = (0, articleMetadata_1.decodeHtmlEntities)(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        return text.slice(0, 80) || null;
    }
    extractMessageText(html) {
        const match = html.match(/<div[^>]*class="tgme_widget_message_text"[^>]*>([\s\S]*?)<\/div>/i);
        if (!match?.[1]) {
            return null;
        }
        return (0, articleMetadata_1.decodeHtmlEntities)(match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
    extractPublishedAt(html) {
        const time = html.match(/<time[^>]+datetime="([^"]+)"/i);
        return time?.[1] ? (0, articleMetadata_1.parseDateValue)(time[1]) : null;
    }
}
exports.TelegramExtractor = TelegramExtractor;

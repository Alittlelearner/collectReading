"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatExtractor = void 0;
class WechatExtractor {
    constructor() {
        this.id = 'wechat';
        this.displayName = '微信公众号';
        this.pattern = /mp\.weixin\.qq\.com\//;
        this.sourceType = 'wechat';
        this.needsHTML = true;
        this.priority = 85;
    }
    async extract(url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        return {
            title: this.extractScriptValue(html, ['msg_title', 'window.msg_title']) || this.extractTag(html, 'title'),
            description: this.extractScriptValue(html, ['msg_desc', 'window.msg_desc']) ||
                this.extractMeta(html, 'description') ||
                '',
            imageUrl: this.extractScriptValue(html, ['msg_cdn_url', 'window.msg_cdn_url']) ||
                this.extractScriptValue(html, ['ori_head_img_url']) ||
                this.extractMeta(html, 'og:image'),
            author: this.extractScriptValue(html, ['nickname', 'user_name']) ||
                this.extractMeta(html, 'author') ||
                null,
            sourceType: 'wechat',
            sourceDomain,
            originalTags: [],
            publishedAt: this.toMillis(this.extractScriptNumber(html, ['publish_time', 'ct'])),
        };
    }
    extractScriptValue(html, keys) {
        for (const key of keys) {
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const patterns = [
                new RegExp(`${escaped}\\s*=\\s*["']([^"']+)["']`, 'i'),
                new RegExp(`${escaped}\\s*:\\s*["']([^"']+)["']`, 'i'),
            ];
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match?.[1]) {
                    return this.decodeJsString(match[1]);
                }
            }
        }
        return null;
    }
    extractScriptNumber(html, keys) {
        for (const key of keys) {
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const patterns = [
                new RegExp(`${escaped}\\s*=\\s*(\\d+)`, 'i'),
                new RegExp(`${escaped}\\s*:\\s*(\\d+)`, 'i'),
            ];
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match?.[1]) {
                    return Number(match[1]);
                }
            }
        }
        return null;
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? match[1] : null;
    }
    extractTag(html, tag) {
        const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
        return match ? match[1].trim() : '';
    }
    decodeJsString(value) {
        return value
            .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\n/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .trim();
    }
    toMillis(value) {
        if (!value) {
            return null;
        }
        return value > 1000000000000 ? value : value * 1000;
    }
}
exports.WechatExtractor = WechatExtractor;

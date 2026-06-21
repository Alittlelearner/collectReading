"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericExtractor = void 0;
class GenericExtractor {
    constructor() {
        this.id = 'generic';
        this.displayName = '通用链接';
        this.pattern = /./;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = -100;
    }
    async extract(url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain || this.extractDomain(url);
        return {
            title: this.extractTitle(html) || sourceDomain || url,
            description: this.extractDescription(html),
            imageUrl: this.extractImage(html),
            author: this.extractAuthor(html),
            sourceType: this.inferSourceType(html, sourceDomain),
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
            return '';
        }
    }
    extractTitle(html) {
        const og = this.extractMeta(html, ['og:title', 'twitter:title']);
        if (og)
            return og;
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? match[1].trim() : '';
    }
    extractDescription(html) {
        return this.extractMeta(html, ['og:description', 'twitter:description', 'description']) ?? '';
    }
    extractImage(html) {
        return this.extractMeta(html, ['og:image', 'twitter:image']);
    }
    extractAuthor(html) {
        return this.extractMeta(html, ['article:author', 'author']);
    }
    extractMeta(html, properties) {
        for (const prop of properties) {
            const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${escaped}["'][^>]+content=["']([^"']+)`, 'i');
            const match = html.match(pattern);
            if (match && match[1])
                return match[1];
        }
        return null;
    }
    inferSourceType(_html, domain) {
        if (/bilibili\.com/.test(domain))
            return 'bilibili';
        if (/zhihu\.com/.test(domain))
            return 'zhihu';
        if (/mp\.weixin\.qq\.com/.test(domain))
            return 'wechat';
        if (/weread\.qq\.com|duokan\.com|ireader\.com/.test(domain))
            return 'ebook';
        if (/metaso\.com/.test(domain))
            return 'metasearch';
        if (/okjike\.com/.test(domain))
            return 'jike';
        if (/xueqiu\.com/.test(domain))
            return 'xueqiu';
        if (/juejin\.cn/.test(domain))
            return 'website';
        if (/douban\.com/.test(domain))
            return 'other';
        if (/sspai\.com/.test(domain))
            return 'website';
        if (/medium\.com/.test(domain))
            return 'website';
        if (/github\.com/.test(domain))
            return 'website';
        if (/xiaohongshu\.com|xhslink\.com/.test(domain))
            return 'other';
        return 'website';
    }
}
exports.GenericExtractor = GenericExtractor;

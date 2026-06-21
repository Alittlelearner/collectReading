"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoubanExtractor = void 0;
class DoubanExtractor {
    constructor() {
        this.id = 'douban';
        this.displayName = '豆瓣';
        this.pattern = /douban\.com\//;
        this.sourceType = 'other';
        this.needsHTML = true;
        this.priority = 70;
    }
    async extract(url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const jsonLd = this.extractJsonLd(html);
        return {
            title: this.extractTitle(html, jsonLd),
            description: this.extractDescription(html),
            imageUrl: this.extractImage(html),
            author: this.extractAuthor(html, jsonLd),
            sourceType: 'other',
            sourceDomain,
            originalTags: this.extractTags(html, jsonLd),
            publishedAt: this.extractPublishedAt(html),
        };
    }
    extractTitle(html, jsonLd) {
        if (jsonLd?.name) {
            return jsonLd.name;
        }
        const ogTitle = this.extractMeta(html, 'og:title');
        if (ogTitle)
            return ogTitle;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1].replace(/\s*\(豆瓣\)\s*$/, '').trim() : '';
    }
    extractDescription(html) {
        const ogDesc = this.extractMeta(html, 'og:description');
        if (ogDesc)
            return ogDesc;
        const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
        return descMatch ? descMatch[1] : '';
    }
    extractImage(html) {
        const ogImage = this.extractMeta(html, 'og:image');
        if (ogImage)
            return ogImage;
        const coverMatch = html.match(/<img[^>]+src="([^"]+)"[^>]+rel="v:image"/i);
        return coverMatch ? coverMatch[1] : null;
    }
    extractAuthor(html, jsonLd) {
        if (Array.isArray(jsonLd?.author) && jsonLd.author.length > 0) {
            return jsonLd.author
                .map((item) => item?.name)
                .filter((name) => typeof name === 'string' && name.trim().length > 0)
                .join(' / ');
        }
        const infoBlock = this.extractInfoValue(html, '作者');
        if (infoBlock) {
            return infoBlock;
        }
        return this.extractMeta(html, 'article:author');
    }
    extractTags(html, jsonLd) {
        const tags = new Set();
        if (jsonLd?.['@type']) {
            tags.add(String(jsonLd['@type']));
        }
        const title = this.extractTitle(html, jsonLd);
        if (title) {
            const suffixes = ['(豆瓣)'];
            suffixes.forEach((suffix) => {
                if (title.endsWith(suffix)) {
                    tags.add(suffix.replace(/[()]/g, ''));
                }
            });
        }
        return Array.from(tags);
    }
    extractPublishedAt(html) {
        const raw = this.extractInfoValue(html, '出版年');
        if (!raw) {
            return null;
        }
        const parsed = Date.parse(raw.replace(/\./g, '-'));
        return Number.isNaN(parsed) ? null : parsed;
    }
    extractInfoValue(html, label) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<span[^>]*class="pl">\\s*${escaped}:<\\/span>\\s*([\\s\\S]*?)(?:<br\\/?|<span[^>]*class="pl">)`, 'i'));
        if (!match?.[1]) {
            return null;
        }
        return match[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    extractJsonLd(html) {
        const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
        if (!match?.[1]) {
            return null;
        }
        try {
            return JSON.parse(match[1]);
        }
        catch {
            return null;
        }
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? match[1] : null;
    }
}
exports.DoubanExtractor = DoubanExtractor;

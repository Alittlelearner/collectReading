"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediumExtractor = void 0;
const network_1 = require("../network");
class MediumExtractor {
    constructor() {
        this.id = 'medium';
        this.displayName = 'Medium';
        this.pattern = /medium\.com\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 60;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        const feedMetadata = await this.extractFromFeed(url, sourceDomain);
        if (feedMetadata) {
            return feedMetadata;
        }
        const html = context.html || '';
        return {
            title: this.extractTitle(html),
            description: this.extractDescription(html),
            imageUrl: this.extractImage(html),
            author: this.extractAuthor(html),
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    async extractFromFeed(url, sourceDomain) {
        const publication = this.extractPublicationPath(url);
        if (!publication) {
            return null;
        }
        const feedUrl = `https://medium.com/feed/${publication}`;
        try {
            const feedXml = await (0, network_1.fetchTextWithTimeout)(feedUrl, {
                headers: {
                    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
                    'User-Agent': 'Mozilla/5.0',
                },
            }, 8000);
            const items = this.parseFeedItems(feedXml);
            const matched = items.find((item) => this.matchesMediumUrl(item, url));
            if (!matched) {
                return null;
            }
            return {
                title: matched.title,
                description: matched.description,
                imageUrl: matched.imageUrl,
                author: matched.author,
                sourceType: 'website',
                sourceDomain,
                originalTags: matched.originalTags,
                publishedAt: matched.publishedAt,
            };
        }
        catch {
            return null;
        }
    }
    extractPublicationPath(url) {
        try {
            const parsed = new URL(url);
            if (!/medium\.com$/i.test(parsed.hostname)) {
                return null;
            }
            const segments = parsed.pathname.split('/').filter(Boolean);
            if (segments.length === 0) {
                return null;
            }
            const first = segments[0];
            if (first === 'p') {
                return null;
            }
            return first;
        }
        catch {
            return null;
        }
    }
    matchesMediumUrl(item, targetUrl) {
        const targetId = this.extractStoryId(targetUrl);
        const itemId = this.extractStoryId(item.url) || this.extractStoryId(item.guid);
        return Boolean(targetId && itemId && targetId === itemId);
    }
    extractStoryId(url) {
        const match = url.match(/-([a-f0-9]{12,})/i);
        return match ? match[1].toLowerCase() : null;
    }
    parseFeedItems(xml) {
        const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
        return itemMatches.map((itemXml) => {
            const description = this.decodeCdata(this.extractXmlValue(itemXml, 'description'));
            const content = this.decodeCdata(this.extractXmlValue(itemXml, 'content:encoded'));
            const link = this.extractXmlValue(itemXml, 'link') || '';
            const guid = this.extractXmlValue(itemXml, 'guid') || '';
            return {
                title: this.decodeCdata(this.extractXmlValue(itemXml, 'title')) || '',
                description: this.extractSnippet(description) || this.extractSnippet(content),
                imageUrl: this.extractImageFromHtml(description) || this.extractImageFromHtml(content),
                author: this.decodeCdata(this.extractXmlValue(itemXml, 'dc:creator')) || null,
                publishedAt: this.parseDate(this.extractXmlValue(itemXml, 'pubDate')),
                originalTags: this.extractCategories(itemXml),
                url: link,
                guid,
            };
        });
    }
    extractXmlValue(xml, tag) {
        const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
        return match?.[1]?.trim() || null;
    }
    decodeCdata(value) {
        if (!value) {
            return '';
        }
        return value
            .replace(/^<!\[CDATA\[/, '')
            .replace(/\]\]>$/, '')
            .trim();
    }
    extractSnippet(html) {
        const snippetMatch = html.match(/<p[^>]*class="medium-feed-snippet"[^>]*>([\s\S]*?)<\/p>/i);
        if (snippetMatch?.[1]) {
            return this.stripHtml(snippetMatch[1]);
        }
        return this.stripHtml(html).slice(0, 180).trim();
    }
    extractImageFromHtml(html) {
        const match = html.match(/<img[^>]+src="([^"]+)"/i);
        return match?.[1] || null;
    }
    extractCategories(xml) {
        const matches = [...xml.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/gi)];
        return matches
            .map((match) => match[1]?.trim())
            .filter((value) => Boolean(value));
    }
    parseDate(value) {
        if (!value) {
            return null;
        }
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    stripHtml(value) {
        return value
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    extractTitle(html) {
        const ogTitle = this.extractMeta(html, 'og:title');
        if (ogTitle)
            return ogTitle;
        const rhTitle = html.match(/<title[^>]*data-rh="true"[^>]*>([^<]+)<\/title>/i);
        if (rhTitle?.[1])
            return rhTitle[1].trim();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1].replace(/ - Medium$/, '').trim() : '';
    }
    extractDescription(html) {
        const ogDesc = this.extractMeta(html, 'og:description');
        if (ogDesc)
            return ogDesc;
        const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
        return descMatch ? descMatch[1] : '';
    }
    extractImage(html) {
        return this.extractMeta(html, 'og:image') || this.extractMeta(html, 'twitter:image');
    }
    extractAuthor(html) {
        return this.extractMeta(html, 'article:author') || this.extractMeta(html, 'author');
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? match[1] : null;
    }
}
exports.MediumExtractor = MediumExtractor;

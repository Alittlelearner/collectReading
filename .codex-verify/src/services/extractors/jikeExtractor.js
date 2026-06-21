"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JikeExtractor = void 0;
const network_1 = require("../network");
const media_1 = require("../../utils/media");
const MOBILE_JIKE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
class JikeExtractor {
    constructor() {
        this.id = 'jike';
        this.displayName = '即刻';
        this.pattern = /okjike\.com\//;
        this.sourceType = 'jike';
        this.needsHTML = true;
        this.priority = 82;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        const html = await this.getBestHtml(url, context.html || '');
        const nextData = this.extractNextData(html);
        const post = nextData?.props?.pageProps?.post;
        return {
            title: this.cleanText(post?.content).split('\n').find(Boolean)?.trim() ||
                this.extractMeta(html, 'og:title') ||
                this.extractTag(html, 'title'),
            description: this.cleanText(post?.content) ||
                this.extractMeta(html, 'og:description') ||
                this.extractMeta(html, 'description') ||
                '',
            imageUrl: (0, media_1.normalizeImageUrl)(this.extractImage(post) || this.extractMeta(html, 'og:image')),
            author: post?.user?.screenName || post?.user?.nickname || post?.user?.username || null,
            sourceType: 'jike',
            sourceDomain,
            originalTags: this.extractTopics(post),
            publishedAt: this.parseDate(post?.createdAt),
        };
    }
    async getBestHtml(url, html) {
        if (this.hasUsefulState(html)) {
            return html;
        }
        const mobileUrl = this.toMobileUrl(url);
        try {
            const mobileHtml = await (0, network_1.fetchTextWithTimeout)(mobileUrl, {
                headers: {
                    'User-Agent': MOBILE_JIKE_UA,
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            }, 8000);
            return this.hasUsefulState(mobileHtml) ? mobileHtml : html;
        }
        catch {
            return html;
        }
    }
    toMobileUrl(url) {
        try {
            const parsed = new URL(url);
            parsed.hostname = 'm.okjike.com';
            const match = parsed.pathname.match(/\/(originalPosts|posts|reposts)\/([^/?#]+)/i);
            if (match) {
                parsed.pathname = `/${match[1]}/${match[2]}`;
            }
            return parsed.toString();
        }
        catch {
            return url;
        }
    }
    hasUsefulState(html) {
        return html.includes('__NEXT_DATA__') && html.includes('"post"');
    }
    extractNextData(html) {
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
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
    extractImage(post) {
        const media = post?.pictureImages?.[0] || post?.images?.[0];
        const candidate = media?.picUrl ||
            media?.url ||
            media?.middlePicUrl ||
            media?.smallPicUrl ||
            media?.thumbnailUrl ||
            post?.video?.image?.picUrl ||
            post?.video?.image?.thumbnailUrl ||
            post?.video?.thumbnailUrl;
        return typeof candidate === 'string' ? candidate : null;
    }
    extractTopics(post) {
        const topics = new Set();
        const topic = post?.topic;
        const topicName = topic?.content || topic?.name;
        if (typeof topicName === 'string' && topicName.trim()) {
            topics.add(topicName.trim());
        }
        const communities = post?.communities;
        if (Array.isArray(communities)) {
            communities
                .map((item) => item?.name || item?.title)
                .filter((name) => typeof name === 'string' && name.trim().length > 0)
                .forEach((name) => topics.add(name.trim()));
        }
        return Array.from(topics);
    }
    extractMeta(html, property) {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'));
        return match ? this.decodeHtmlEntities(match[1]) : null;
    }
    extractTag(html, tag) {
        const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
        return match ? this.decodeHtmlEntities(match[1].trim()) : '';
    }
    decodeHtmlEntities(value) {
        return value
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
    cleanText(value) {
        if (typeof value !== 'string') {
            return '';
        }
        return value.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
    }
    parseDate(value) {
        if (typeof value !== 'string' || !value.trim()) {
            return null;
        }
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
}
exports.JikeExtractor = JikeExtractor;

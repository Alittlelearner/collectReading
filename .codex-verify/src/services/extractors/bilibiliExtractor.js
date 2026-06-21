"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BilibiliExtractor = void 0;
const react_native_1 = require("react-native");
const network_1 = require("../network");
class BilibiliExtractor {
    constructor() {
        this.id = 'bilibili';
        this.displayName = 'Bilibili';
        this.pattern = /bilibili\.com\/video\//;
        this.sourceType = 'bilibili';
        this.needsHTML = false;
        this.priority = 100;
    }
    async extract(url, context) {
        const sourceDomain = context.sourceDomain;
        try {
            const bvid = this.extractBVID(url);
            if (!bvid)
                return this.emptyResult(url, sourceDomain);
            const json = await this.fetchViewData(bvid);
            if (json.code !== 0 || !json.data) {
                return this.emptyResult(url, sourceDomain);
            }
            const tags = await this.fetchTags(bvid);
            const normalizedDescription = this.normalizeDescription(json.data.desc);
            return {
                title: json.data.title || '',
                description: normalizedDescription,
                imageUrl: this.normalizeCoverUrl(json.data.pic),
                author: json.data.owner?.name || null,
                sourceType: 'bilibili',
                sourceDomain,
                originalTags: tags,
                publishedAt: typeof json.data.pubdate === 'number' ? json.data.pubdate * 1000 : null,
            };
        }
        catch {
            return this.emptyResult(url, sourceDomain);
        }
    }
    extractBVID(url) {
        const match = url.match(/BV[a-zA-Z0-9]+/);
        return match ? match[0] : null;
    }
    async fetchTags(bvid) {
        try {
            const json = await this.fetchBilibiliJson(`https://api.bilibili.com/x/tag/archive/tags?bvid=${encodeURIComponent(bvid)}`);
            if (json.code !== 0 || !Array.isArray(json.data))
                return [];
            return json.data
                .map((tag) => tag?.tag_name)
                .filter((tag) => typeof tag === 'string' && tag.trim().length > 0);
        }
        catch {
            return [];
        }
    }
    async fetchViewData(bvid) {
        return this.fetchBilibiliJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`);
    }
    normalizeDescription(value) {
        if (typeof value !== 'string')
            return '';
        const trimmed = value.trim();
        if (!trimmed || trimmed === '-' || trimmed === '--' || trimmed === '—') {
            return '';
        }
        return trimmed;
    }
    normalizeCoverUrl(value) {
        if (typeof value !== 'string')
            return null;
        const trimmed = value.trim();
        if (!trimmed)
            return null;
        if (trimmed.startsWith('//'))
            return `https:${trimmed}`;
        if (trimmed.startsWith('http://'))
            return `https://${trimmed.slice('http://'.length)}`;
        return trimmed;
    }
    async fetchBilibiliJson(url) {
        if (react_native_1.Platform.OS === 'web') {
            return (0, network_1.fetchJsonp)(url, { callbackParam: 'callback', timeoutMs: 5000 });
        }
        return (0, network_1.fetchJsonWithTimeout)(url, {
            headers: {
                Accept: 'application/json',
                Referer: 'https://www.bilibili.com/',
                Origin: 'https://www.bilibili.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        }, 5000);
    }
    emptyResult(url, sourceDomain) {
        return {
            title: '',
            description: '',
            imageUrl: null,
            author: null,
            sourceType: 'bilibili',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
}
exports.BilibiliExtractor = BilibiliExtractor;

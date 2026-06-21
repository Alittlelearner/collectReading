"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyArticleMetadata = createEmptyArticleMetadata;
exports.extractMeta = extractMeta;
exports.extractTitleTag = extractTitleTag;
exports.extractJsonLdObjects = extractJsonLdObjects;
exports.findJsonLdByType = findJsonLdByType;
exports.extractTextFromHtml = extractTextFromHtml;
exports.createArticleMetadataFromGenericHtml = createArticleMetadataFromGenericHtml;
exports.stripTitleSuffixes = stripTitleSuffixes;
exports.splitKeywords = splitKeywords;
exports.parseDateValue = parseDateValue;
exports.extractNextData = extractNextData;
exports.extractInitialState = extractInitialState;
exports.decodeHtmlEntities = decodeHtmlEntities;
const media_1 = require("../../utils/media");
function createEmptyArticleMetadata() {
    return {
        title: '',
        description: '',
        imageUrl: null,
        author: null,
        originalTags: [],
        publishedAt: null,
    };
}
function extractMeta(html, property) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
            return decodeHtmlEntities(match[1].trim());
        }
    }
    return null;
}
function extractTitleTag(html) {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? decodeHtmlEntities(match[1].trim()) : '';
}
function extractJsonLdObjects(html) {
    const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    const results = [];
    for (const match of matches) {
        const raw = match[1]?.trim();
        if (!raw)
            continue;
        try {
            const parsed = JSON.parse(decodeHtmlEntities(raw));
            if (Array.isArray(parsed)) {
                results.push(...parsed);
            }
            else {
                results.push(parsed);
            }
        }
        catch { }
    }
    return results;
}
function findJsonLdByType(items, types) {
    const normalizedTypes = new Set(types.map((type) => type.toLowerCase()));
    return (items.find((item) => {
        const value = item?.['@type'];
        if (typeof value === 'string') {
            return normalizedTypes.has(value.toLowerCase());
        }
        if (Array.isArray(value)) {
            return value.some((entry) => typeof entry === 'string' && normalizedTypes.has(entry.toLowerCase()));
        }
        return false;
    }) || null);
}
function extractTextFromHtml(html) {
    return decodeHtmlEntities(html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim());
}
function createArticleMetadataFromGenericHtml(html, options = {}) {
    const jsonLdObjects = extractJsonLdObjects(html);
    const articleJsonLd = findJsonLdByType(jsonLdObjects, ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'VideoObject']) ||
        jsonLdObjects[0] ||
        null;
    const title = extractJsonLdTitle(articleJsonLd) ||
        extractMeta(html, 'og:title') ||
        extractMeta(html, 'twitter:title') ||
        extractTitleTag(html);
    const description = extractJsonLdDescription(articleJsonLd) ||
        extractMeta(html, 'og:description') ||
        extractMeta(html, 'twitter:description') ||
        extractMeta(html, 'description') ||
        '';
    const imageUrl = (0, media_1.normalizeImageUrl)(extractJsonLdImage(articleJsonLd) || extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image'));
    const author = extractJsonLdAuthor(articleJsonLd) ||
        extractMeta(html, 'article:author') ||
        extractMeta(html, 'author') ||
        extractAuthorBySelectors(html, options.authorSelectors || []);
    const publishedAt = parseDateValue(extractJsonLdDate(articleJsonLd) ||
        extractMeta(html, 'article:published_time') ||
        extractMeta(html, 'publish_date') ||
        extractMeta(html, 'og:release_date'));
    const originalTags = extractJsonLdKeywords(articleJsonLd) || splitKeywords(extractMeta(html, 'keywords') || '');
    return {
        title: stripTitleSuffixes(title, options.titleSuffixes || []),
        description,
        imageUrl,
        author,
        originalTags,
        publishedAt,
    };
}
function stripTitleSuffixes(title, suffixes) {
    if (!title) {
        return '';
    }
    let result = title.trim();
    for (const suffix of suffixes) {
        if (suffix && result.endsWith(suffix)) {
            result = result.slice(0, -suffix.length).trim();
        }
    }
    return result;
}
function splitKeywords(value) {
    if (!value) {
        return [];
    }
    return Array.from(new Set(value
        .split(/[;,|/]/)
        .map((item) => item.trim())
        .filter(Boolean)));
}
function parseDateValue(value) {
    if (typeof value === 'number') {
        return value > 1000000000000 ? value : value * 1000;
    }
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }
    const decoded = decodeHtmlEntities(value.trim()).replace(/&#x2B;/gi, '+');
    const parsed = Date.parse(decoded);
    return Number.isNaN(parsed) ? null : parsed;
}
function extractNextData(html) {
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
function extractInitialState(html) {
    const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})<\/script>/i);
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
function decodeHtmlEntities(value) {
    return value
        .replace(/&#x2B;/gi, '+')
        .replace(/&#8211;/g, '-')
        .replace(/&#8212;/g, '-')
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8230;/g, '...')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}
function extractJsonLdTitle(articleJsonLd) {
    return ((typeof articleJsonLd?.headline === 'string' && articleJsonLd.headline.trim()) ||
        (typeof articleJsonLd?.name === 'string' && articleJsonLd.name.trim()) ||
        (typeof articleJsonLd?.title === 'string' && articleJsonLd.title.trim()) ||
        '');
}
function extractJsonLdDescription(articleJsonLd) {
    return typeof articleJsonLd?.description === 'string' ? articleJsonLd.description.trim() : '';
}
function extractJsonLdImage(articleJsonLd) {
    const image = articleJsonLd?.image || articleJsonLd?.thumbnailUrl;
    if (typeof image === 'string' && image.trim()) {
        return image.trim();
    }
    if (Array.isArray(image)) {
        const first = image.find((item) => typeof item === 'string' && item.trim());
        return first || null;
    }
    if (image && typeof image === 'object') {
        if (typeof image.url === 'string' && image.url.trim()) {
            return image.url.trim();
        }
    }
    return null;
}
function extractJsonLdAuthor(articleJsonLd) {
    const author = articleJsonLd?.author;
    if (typeof author === 'string' && author.trim()) {
        return author.trim();
    }
    if (Array.isArray(author)) {
        const names = author
            .map((item) => {
            if (typeof item === 'string')
                return item.trim();
            if (item && typeof item.name === 'string')
                return item.name.trim();
            return '';
        })
            .filter(Boolean);
        return names.length > 0 ? names.join(' / ') : null;
    }
    if (author && typeof author.name === 'string' && author.name.trim()) {
        return author.name.trim();
    }
    return null;
}
function extractJsonLdDate(articleJsonLd) {
    return ((typeof articleJsonLd?.datePublished === 'string' && articleJsonLd.datePublished.trim()) ||
        (typeof articleJsonLd?.uploadDate === 'string' && articleJsonLd.uploadDate.trim()) ||
        (typeof articleJsonLd?.pubDate === 'string' && articleJsonLd.pubDate.trim()) ||
        (typeof articleJsonLd?.dateCreated === 'string' && articleJsonLd.dateCreated.trim()) ||
        '');
}
function extractJsonLdKeywords(articleJsonLd) {
    const keywords = articleJsonLd?.keywords;
    if (Array.isArray(keywords)) {
        return keywords
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
    }
    if (typeof keywords === 'string') {
        return splitKeywords(keywords);
    }
    return [];
}
function extractAuthorBySelectors(html, selectors) {
    for (const selector of selectors) {
        const match = html.match(selector);
        if (match?.[1]) {
            return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        }
    }
    return null;
}

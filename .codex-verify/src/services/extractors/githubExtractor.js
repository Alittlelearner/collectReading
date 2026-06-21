"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubExtractor = void 0;
const network_1 = require("../network");
class GitHubExtractor {
    constructor() {
        this.id = 'github';
        this.displayName = 'GitHub';
        this.pattern = /github\.com\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 80;
    }
    async extract(url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const pageType = this.detectPageType(url);
        switch (pageType) {
            case 'repo':
                return this.extractRepo(url, html, sourceDomain);
            case 'gist':
                return this.extractGist(url, html, sourceDomain);
            default:
                return this.extractGeneric(html, sourceDomain);
        }
    }
    detectPageType(url) {
        if (/github\.com\/[\w.-]+\/[\w.-]+(?:\/)?(?:\?.*)?$/.test(url))
            return 'repo';
        if (/gist\.github\.com\//.test(url))
            return 'gist';
        return 'other';
    }
    async extractRepo(url, html, sourceDomain) {
        const parsed = this.extractRepoParts(url);
        if (parsed) {
            try {
                const response = await (0, network_1.fetchWithTimeout)(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
                    headers: {
                        Accept: 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                }, 5000);
                if (response.ok) {
                    const repo = await response.json();
                    return {
                        title: repo.full_name || `${parsed.owner}/${parsed.repo}`,
                        description: repo.description || '',
                        imageUrl: repo.owner?.avatar_url || `https://avatars.githubusercontent.com/${parsed.owner}`,
                        author: repo.owner?.login || parsed.owner,
                        sourceType: 'website',
                        sourceDomain,
                        originalTags: Array.isArray(repo.topics) ? repo.topics : [],
                        publishedAt: repo.created_at ? Date.parse(repo.created_at) : null,
                    };
                }
            }
            catch { }
        }
        const ogTitle = this.extractMeta(html, 'og:title');
        const ogDesc = this.extractMeta(html, 'og:description');
        const ogImage = this.extractMeta(html, 'og:image');
        return {
            title: ogTitle ? ogTitle.replace(/ by .*$/, '') : parsed ? `${parsed.owner}/${parsed.repo}` : '',
            description: ogDesc || '',
            imageUrl: ogImage || (parsed ? `https://avatars.githubusercontent.com/${parsed.owner}` : null),
            author: parsed?.owner || null,
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractGist(url, html, sourceDomain) {
        const ogTitle = this.extractMeta(html, 'og:title');
        const ogDesc = this.extractMeta(html, 'og:description');
        const ogImage = this.extractMeta(html, 'og:image');
        return {
            title: ogTitle || 'GitHub Gist',
            description: ogDesc || '',
            imageUrl: ogImage || 'https://github.githubassets.com/images/modules/gist/gist-card-preview.png',
            author: null,
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractGeneric(html, sourceDomain) {
        const ogTitle = this.extractMeta(html, 'og:title');
        const ogDesc = this.extractMeta(html, 'og:description');
        const ogImage = this.extractMeta(html, 'og:image');
        const author = this.extractMeta(html, 'article:author');
        return {
            title: ogTitle || this.extractTag(html, 'title'),
            description: ogDesc || '',
            imageUrl: ogImage,
            author,
            sourceType: 'website',
            sourceDomain,
            originalTags: [],
            publishedAt: null,
        };
    }
    extractRepoParts(url) {
        const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
        if (!match)
            return null;
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
        };
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
}
exports.GitHubExtractor = GitHubExtractor;

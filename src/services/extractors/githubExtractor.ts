import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchWithTimeout } from '../network';

export class GitHubExtractor implements Extractor {
  readonly id = 'github';
  readonly displayName = 'GitHub';
  readonly pattern = /github\.com\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 80;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
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

  private detectPageType(url: string): 'repo' | 'gist' | 'other' {
    if (/github\.com\/[\w.-]+\/[\w.-]+(?:\/)?(?:\?.*)?$/.test(url)) return 'repo';
    if (/gist\.github\.com\//.test(url)) return 'gist';
    return 'other';
  }

  private async extractRepo(url: string, html: string, sourceDomain: string): Promise<ExtractedMetadata> {
    const parsed = this.extractRepoParts(url);

    if (parsed) {
      try {
        const response = await fetchWithTimeout(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          },
          5000,
        );

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
      } catch {}
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

  private extractGist(url: string, html: string, sourceDomain: string): ExtractedMetadata {
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

  private extractGeneric(html: string, sourceDomain: string): ExtractedMetadata {
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

  private extractRepoParts(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }

  private extractTag(html: string, tag: string): string {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }
}

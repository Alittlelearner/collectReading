import { Extractor, ExtractedMetadata, SourceType } from './types';

export class GitHubExtractor implements Extractor {
  readonly pattern = /github\.com\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;
    const pageType = this.detectPageType(url);
    const sourceType = pageType === 'repo' ? 'website' : 'website';

    switch (pageType) {
      case 'repo':
        return this.extractRepo(url, html, sourceDomain);
      case 'gist':
        return this.extractGist(url, html, sourceDomain);
      default:
        return this.extractGeneric(url, html, sourceDomain);
    }
  }

  private detectPageType(url: string): 'repo' | 'gist' | 'profile' | 'other' {
    if (/github\.com\/[\w-]+\/[\w-]+$/.test(url)) return 'repo';
    if (/gist\.github\.com\//.test(url)) return 'gist';
    if (/github\.com\/[\w-]+(?:\/.*)?$/.test(url) && !url.includes('/')) return 'profile';
    return 'other';
  }

  private extractRepo(url: string, html: string, sourceDomain: string): ExtractedMetadata {
    const ogTitle = this.extractMeta(html, 'og:title');
    const ogDesc = this.extractMeta(html, 'og:description');
    const ogImage = this.extractMeta(html, 'og:image');

    // 从 URL 提取 owner/repo
    const parts = url.replace('https://github.com/', '').split('/');
    const owner = parts[0] || '';
    const repo = parts[1]?.replace(/\.git$/, '') || '';

    return {
      title: ogTitle ? ogTitle.replace(/ by .*$/, '') : `${owner}/${repo}`,
      description: ogDesc || '',
      imageUrl: ogImage || `https://avatars.githubusercontent.com/${owner}`,
      author: owner || null,
      sourceType: 'website' as SourceType,
      sourceDomain,
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
      sourceType: 'website' as SourceType,
      sourceDomain,
    };
  }

  private extractGeneric(url: string, html: string, sourceDomain: string): ExtractedMetadata {
    const ogTitle = this.extractMeta(html, 'og:title');
    const ogDesc = this.extractMeta(html, 'og:description');
    const ogImage = this.extractMeta(html, 'og:image');
    const author = this.extractMeta(html, 'article:author');

    return {
      title: ogTitle || this.extractTag(html, 'title'),
      description: ogDesc || '',
      imageUrl: ogImage,
      author: author,
      sourceType: 'website' as SourceType,
      sourceDomain,
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

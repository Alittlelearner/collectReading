import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';

export class XueqiuExtractor implements Extractor {
  readonly id = 'xueqiu';
  readonly displayName = '雪球';
  readonly pattern = /xueqiu\.com\//;
  readonly sourceType: SourceType = 'xueqiu';
  readonly needsHTML = true;
  readonly priority = 81;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;

    if (this.isWafInterstitial(html)) {
      return this.emptyResult(sourceDomain);
    }

    const jsonLd = this.extractJsonLd(html);
    const title = this.extractTitle(html, jsonLd);
    const description = this.extractDescription(html, jsonLd);
    const imageUrl = this.extractImage(html, jsonLd);
    const author = this.extractAuthor(html, jsonLd);
    const publishedAt = this.extractPublishedAt(jsonLd, html);
    const originalTags = this.extractTags(jsonLd);

    return {
      title,
      description,
      imageUrl,
      author,
      sourceType: 'xueqiu',
      sourceDomain,
      originalTags,
      publishedAt,
    };
  }

  private isWafInterstitial(html: string): boolean {
    return html.includes('aliyun_waf') || html.includes('id="renderData"');
  }

  private extractJsonLd(html: string): any | null {
    const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (!match?.[1]) {
      return null;
    }

    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  private extractTitle(html: string, jsonLd: any): string {
    if (typeof jsonLd?.headline === 'string' && jsonLd.headline.trim()) {
      return jsonLd.headline.trim();
    }

    if (typeof jsonLd?.name === 'string' && jsonLd.name.trim()) {
      return jsonLd.name.trim();
    }

    const metaTitle = this.extractMeta(html, 'og:title') || this.extractMeta(html, 'twitter:title');
    if (metaTitle) {
      return metaTitle;
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/\s*-\s*雪球\s*$/, '').trim() : '';
  }

  private extractDescription(html: string, jsonLd: any): string {
    if (typeof jsonLd?.description === 'string' && jsonLd.description.trim()) {
      return jsonLd.description.trim();
    }

    return (
      this.extractMeta(html, 'og:description') ||
      this.extractMeta(html, 'twitter:description') ||
      this.extractMeta(html, 'description') ||
      ''
    );
  }

  private extractImage(html: string, jsonLd: any): string | null {
    if (typeof jsonLd?.image === 'string' && jsonLd.image.trim()) {
      return jsonLd.image.trim();
    }

    if (typeof jsonLd?.thumbnailUrl === 'string' && jsonLd.thumbnailUrl.trim()) {
      return jsonLd.thumbnailUrl.trim();
    }

    return this.extractMeta(html, 'og:image') || this.extractMeta(html, 'twitter:image');
  }

  private extractAuthor(html: string, jsonLd: any): string | null {
    if (typeof jsonLd?.author === 'string' && jsonLd.author.trim()) {
      return jsonLd.author.trim();
    }

    if (jsonLd?.author?.name && typeof jsonLd.author.name === 'string') {
      return jsonLd.author.name.trim();
    }

    return this.extractMeta(html, 'article:author') || this.extractMeta(html, 'author');
  }

  private extractPublishedAt(jsonLd: any, html: string): number | null {
    const dateValue =
      jsonLd?.datePublished ||
      jsonLd?.dateCreated ||
      this.extractMeta(html, 'article:published_time') ||
      this.extractMeta(html, 'og:release_date');

    if (!dateValue || typeof dateValue !== 'string') {
      return null;
    }

    const parsed = Date.parse(dateValue);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private extractTags(jsonLd: any): string[] {
    const candidates = jsonLd?.keywords;
    if (Array.isArray(candidates)) {
      return candidates
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
    }

    if (typeof candidates === 'string') {
      return candidates
        .split(/[,;|/]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }

  private emptyResult(sourceDomain: string): ExtractedMetadata {
    return {
      title: '',
      description: '',
      imageUrl: null,
      author: null,
      sourceType: 'xueqiu',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }
}

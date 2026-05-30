import { Extractor, ExtractedMetadata, SourceType } from './types';

export class GenericExtractor implements Extractor {
  readonly pattern = /./;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;

  async extract(_url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = this.extractDomain(_url);

    return {
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html),
      sourceType: this.inferSourceType(html, sourceDomain),
      sourceDomain,
    };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private extractTitle(html: string): string {
    const og = this.extractMeta(html, ['og:title', 'twitter:title']);
    if (og) return og;
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
  }

  private extractDescription(html: string): string {
    return this.extractMeta(html, ['og:description', 'twitter:description', 'description']) ?? '';
  }

  private extractImage(html: string): string | null {
    return this.extractMeta(html, ['og:image', 'twitter:image']);
  }

  private extractAuthor(html: string): string | null {
    return this.extractMeta(html, ['article:author', 'author']);
  }

  private extractMeta(html: string, properties: string[]): string | null {
    for (const prop of properties) {
      const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `<meta[^>]+(?:property|name)=["'](?:og:)?${escaped}["'][^>]+content=["']([^"']+)`,
        'i',
      );
      const match = html.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  private inferSourceType(_html: string, domain: string): SourceType {
    if (/bilibili\.com/.test(domain)) return 'bilibili';
    if (/zhihu\.com/.test(domain)) return 'zhihu';
    if (/mp\.weixin\.qq\.com/.test(domain)) return 'wechat';
    if (/weread\.qq\.com|duokan\.com|ireader\.com/.test(domain)) return 'ebook';
    if (/metaso\.com/.test(domain)) return 'metasearch';
    if (/juejin\.cn/.test(domain)) return 'website';
    if (/douban\.com/.test(domain)) return 'other';
    if (/sspai\.com/.test(domain)) return 'website';
    if (/medium\.com/.test(domain)) return 'website';
    if (/github\.com/.test(domain)) return 'website';
    if (/xiaohongshu\.com|xhslink\.com/.test(domain)) return 'other';
    return 'website';
  }
}

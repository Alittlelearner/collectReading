import { Extractor, ExtractedMetadata, SourceType } from './types';

export class ZhihuExtractor implements Extractor {
  readonly pattern = /zhihu\.com\//;
  readonly sourceType: SourceType = 'zhihu';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    return {
      title: this.extractMeta(html, 'og:title') || this.extractTag(html, 'title'),
      description: this.extractMeta(html, 'og:description') || '',
      imageUrl: this.extractMeta(html, 'og:image'),
      author: this.extractAuthor(html),
      sourceType: 'zhihu',
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

  private extractAuthor(html: string): string | null {
    const metaAuthor = this.extractMeta(html, 'article:author');
    if (metaAuthor) return metaAuthor;
    return null;
  }
}

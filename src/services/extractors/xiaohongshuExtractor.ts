import { Extractor, ExtractedMetadata, SourceType } from './types';

export class XiaohongshuExtractor implements Extractor {
  readonly pattern = /xiaohongshu\.com|xhslink\.com/;
  readonly sourceType: SourceType = 'other';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    return {
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html),
      sourceType: 'other',
      sourceDomain,
    };
  }

  private extractTitle(html: string): string {
    // 小红书使用 JSON-LD 或 og:title
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    // 从 JSON-LD 提取
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.name) return json.name;
        if (json.headline) return json.headline;
      } catch {}
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].replace(/ - 小红书$/, '').trim();

    return '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    // 从 JSON-LD 提取
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.description) return json.description;
      } catch {}
    }

    return '';
  }

  private extractImage(html: string): string | null {
    const ogImage = this.extractMeta(html, 'og:image');
    if (ogImage) return ogImage;

    // 从 JSON-LD 提取
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.image) {
          return typeof json.image === 'string' ? json.image : json.image.url;
        }
      } catch {}
    }

    return null;
  }

  private extractAuthor(html: string): string | null {
    // 从 JSON-LD 提取
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.author) {
          return typeof json.author === 'string' ? json.author : json.author.name;
        }
      } catch {}
    }

    const metaAuthor = this.extractMeta(html, 'article:author');
    if (metaAuthor) return metaAuthor;

    return null;
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }
}

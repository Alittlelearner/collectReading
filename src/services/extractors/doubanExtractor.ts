import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';

export class DoubanExtractor implements Extractor {
  readonly id = 'douban';
  readonly displayName = '豆瓣';
  readonly pattern = /douban\.com\//;
  readonly sourceType: SourceType = 'other';
  readonly needsHTML = true;
  readonly priority = 70;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const jsonLd = this.extractJsonLd(html);

    return {
      title: this.extractTitle(html, jsonLd),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html, jsonLd),
      sourceType: 'other',
      sourceDomain,
      originalTags: this.extractTags(html, jsonLd),
      publishedAt: this.extractPublishedAt(html),
    };
  }

  private extractTitle(html: string, jsonLd: any): string {
    if (jsonLd?.name) {
      return jsonLd.name;
    }

    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/\s*\(豆瓣\)\s*$/, '').trim() : '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    return descMatch ? descMatch[1] : '';
  }

  private extractImage(html: string): string | null {
    const ogImage = this.extractMeta(html, 'og:image');
    if (ogImage) return ogImage;

    const coverMatch = html.match(/<img[^>]+src="([^"]+)"[^>]+rel="v:image"/i);
    return coverMatch ? coverMatch[1] : null;
  }

  private extractAuthor(html: string, jsonLd: any): string | null {
    if (Array.isArray(jsonLd?.author) && jsonLd.author.length > 0) {
      return jsonLd.author
        .map((item: any) => item?.name)
        .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
        .join(' / ');
    }

    const infoBlock = this.extractInfoValue(html, '作者');
    if (infoBlock) {
      return infoBlock;
    }

    return this.extractMeta(html, 'article:author');
  }

  private extractTags(html: string, jsonLd: any): string[] {
    const tags = new Set<string>();

    if (jsonLd?.['@type']) {
      tags.add(String(jsonLd['@type']));
    }

    const title = this.extractTitle(html, jsonLd);
    if (title) {
      const suffixes = ['(豆瓣)'];
      suffixes.forEach((suffix) => {
        if (title.endsWith(suffix)) {
          tags.add(suffix.replace(/[()]/g, ''));
        }
      });
    }

    return Array.from(tags);
  }

  private extractPublishedAt(html: string): number | null {
    const raw = this.extractInfoValue(html, '出版年');
    if (!raw) {
      return null;
    }

    const parsed = Date.parse(raw.replace(/\./g, '-'));
    return Number.isNaN(parsed) ? null : parsed;
  }

  private extractInfoValue(html: string, label: string): string | null {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<span[^>]*class="pl">\\s*${escaped}:<\\/span>\\s*([\\s\\S]*?)(?:<br\\/?|<span[^>]*class="pl">)`, 'i'),
    );

    if (!match?.[1]) {
      return null;
    }

    return match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }
}

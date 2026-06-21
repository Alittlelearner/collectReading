import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  decodeHtmlEntities,
  parseDateValue,
  splitKeywords,
} from './articleMetadata';

export class Kr36Extractor implements Extractor {
  readonly id = '36kr';
  readonly displayName = '36Kr';
  readonly pattern = /(?:36kr\.com|m\.36kr\.com)\/p\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 77;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['-36氪', ' - 36氪'],
    });

    return {
      title: base.title,
      description: base.description,
      imageUrl: base.imageUrl || this.extractCover(html),
      author: base.author || this.extractAuthor(html),
      sourceType: 'website',
      sourceDomain,
      originalTags: base.originalTags.length > 0 ? base.originalTags : this.extractTags(html),
      publishedAt: base.publishedAt || this.extractPublishedAt(html),
    };
  }

  private extractAuthor(html: string): string | null {
    const match = html.match(/"authorName"\s*:\s*"([^"]+)"/i);
    return match?.[1] ? decodeHtmlEntities(match[1]) : null;
  }

  private extractCover(html: string): string | null {
    const match = html.match(/"cover"\s*:\s*"([^"]+)"/i);
    if (!match?.[1]) {
      return null;
    }
    const value = decodeHtmlEntities(match[1]);
    return value.startsWith('//') ? `https:${value}` : value;
  }

  private extractPublishedAt(html: string): number | null {
    const match = html.match(/"publishTime"\s*:\s*(\d{10,13})/i);
    return match?.[1] ? parseDateValue(Number(match[1])) : null;
  }

  private extractTags(html: string): string[] {
    const keywords = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
    return keywords?.[1] ? splitKeywords(decodeHtmlEntities(keywords[1]).replace(/，/g, ',')) : [];
  }
}

import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  decodeHtmlEntities,
  parseDateValue,
  splitKeywords,
} from './articleMetadata';

export class InfoqExtractor implements Extractor {
  readonly id = 'infoq';
  readonly displayName = 'InfoQ';
  readonly pattern = /infoq\.cn\/article\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 72;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['- InfoQ', ' - InfoQ'],
      authorSelectors: [
        /<div[^>]*class="[^"]*author[^"]*"[^>]*>[\s\S]*?<[^>]+class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i,
        /<span[^>]*class="[^"]*author[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
      ],
    });

    return {
      title: base.title,
      description: base.description,
      imageUrl: base.imageUrl,
      author: base.author || this.extractAuthor(html),
      sourceType: 'website',
      sourceDomain,
      originalTags: base.originalTags.length > 0 ? base.originalTags : this.extractTags(html),
      publishedAt: base.publishedAt || this.extractPublishedAt(html),
    };
  }

  private extractAuthor(html: string): string | null {
    const match = html.match(/"name":"([^"]+)","avatar":/i);
    return match?.[1] ? decodeHtmlEntities(match[1]) : null;
  }

  private extractTags(html: string): string[] {
    const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
    return match?.[1] ? splitKeywords(decodeHtmlEntities(match[1]).replace(/，/g, ',')) : [];
  }

  private extractPublishedAt(html: string): number | null {
    const match = html.match(/"publishTime"\s*:\s*"([^"]+)"/i);
    return match?.[1] ? parseDateValue(match[1]) : null;
  }
}

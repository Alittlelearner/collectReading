import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  decodeHtmlEntities,
  parseDateValue,
  splitKeywords,
} from './articleMetadata';

export class WoshipmExtractor implements Extractor {
  readonly id = 'woshipm';
  readonly displayName = '人人都是产品经理';
  readonly pattern = /woshipm\.com\/.+\.html/;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 71;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['| 人人都是产品经理', ' - 人人都是产品经理'],
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
    const match = html.match(/<div[^>]*class="author[^"]*"[^>]*>[\s\S]*?<a[^>]*class="[^"]*ui-captionStrong[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    return match?.[1] ? decodeHtmlEntities(match[1].replace(/<[^>]+>/g, '').trim()) : null;
  }

  private extractTags(html: string): string[] {
    const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
    return match?.[1] ? splitKeywords(decodeHtmlEntities(match[1]).replace(/，/g, ',')) : [];
  }

  private extractPublishedAt(html: string): number | null {
    const timeTag = html.match(/<time[^>]*datetime="([^"]+)"/i);
    if (timeTag?.[1]) {
      return parseDateValue(timeTag[1]);
    }

    const looseTime = html.match(/<time[^>]*>([^<]+)<\/time>/i);
    return looseTime?.[1] ? parseDateValue(looseTime[1]) : null;
  }
}

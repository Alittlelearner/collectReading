import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  decodeHtmlEntities,
  parseDateValue,
} from './articleMetadata';

export class TelegramExtractor implements Extractor {
  readonly id = 'telegram';
  readonly displayName = 'Telegram';
  readonly pattern = /t\.me\/[^/]+\/\d+/;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 39;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['| Telegram', ' - Telegram'],
    });

    return {
      title: this.extractMessageTitle(html) || base.title,
      description: this.extractMessageText(html) || base.description,
      imageUrl: base.imageUrl,
      author: this.extractChannelName(html) || base.author,
      sourceType: 'website',
      sourceDomain,
      originalTags: [],
      publishedAt: this.extractPublishedAt(html) || base.publishedAt,
    };
  }

  private extractChannelName(html: string): string | null {
    const match = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    return match?.[1] ? decodeHtmlEntities(match[1]) : null;
  }

  private extractMessageTitle(html: string): string | null {
    const text = this.extractMessageText(html);
    return text ? text.slice(0, 80) : null;
  }

  private extractMessageText(html: string): string | null {
    const metaDescription = html.match(/<meta[^>]+name="twitter:description"[^>]+content="([^"]*)"/i)?.[1];
    if (metaDescription && metaDescription.trim()) {
      return decodeHtmlEntities(metaDescription.trim());
    }

    const ogDescription = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)?.[1];
    if (ogDescription && ogDescription.trim()) {
      return decodeHtmlEntities(ogDescription.trim());
    }

    return null;
  }

  private extractPublishedAt(html: string): number | null {
    const time = html.match(/<time[^>]+datetime="([^"]+)"/i);
    return time?.[1] ? parseDateValue(time[1]) : null;
  }
}

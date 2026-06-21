import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml, extractMeta, extractTitleTag } from './articleMetadata';

export class TwitterExtractor implements Extractor {
  readonly id = 'twitter';
  readonly displayName = 'X';
  readonly pattern = /(?:x\.com|twitter\.com)\/[^/]+\/status\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 37;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const metadata = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: [' / X', ' / Twitter', ' on X'],
    });

    return {
      title: metadata.title || extractTitleTag(html),
      description: metadata.description || extractMeta(html, 'og:description') || '',
      imageUrl: metadata.imageUrl,
      author: this.extractAuthor(html) || metadata.author,
      sourceType: 'website',
      sourceDomain,
      originalTags: [],
      publishedAt: metadata.publishedAt,
    };
  }

  private extractAuthor(html: string): string | null {
    const ogTitle = extractMeta(html, 'og:title');
    if (ogTitle) {
      const ogMatch = ogTitle.match(/^(.+?)\s+\(@[^)]+\)\s+on\s+X/i);
      if (ogMatch?.[1]) {
        return ogMatch[1].trim();
      }
    }

    const title = extractTitleTag(html);
    const titleMatch = title.match(/^(.+?)\s+on\s+X:/i);
    return titleMatch?.[1]?.trim() || null;
  }
}

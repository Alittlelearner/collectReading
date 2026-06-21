import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml } from './articleMetadata';

export class YoutubeExtractor implements Extractor {
  readonly id = 'youtube';
  readonly displayName = 'YouTube';
  readonly pattern = /(?:youtube\.com\/watch|youtu\.be\/)/;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 38;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const metadata = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['- YouTube', ' - YouTube'],
    });

    return {
      ...metadata,
      sourceType: 'website',
      sourceDomain,
    };
  }
}

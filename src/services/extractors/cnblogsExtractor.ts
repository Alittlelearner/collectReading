import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml } from './articleMetadata';

export class CnblogsExtractor implements Extractor {
  readonly id = 'cnblogs';
  readonly displayName = '博客园';
  readonly pattern = /cnblogs\.com\/.+\/p\/.+\.html/;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 74;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const metadata = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['- 博客园', ' - 博客园'],
    });

    return {
      ...metadata,
      sourceType: 'website',
      sourceDomain,
    };
  }
}

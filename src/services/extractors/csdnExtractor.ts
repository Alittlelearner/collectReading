import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml } from './articleMetadata';

export class CsdnExtractor implements Extractor {
  readonly id = 'csdn';
  readonly displayName = 'CSDN';
  readonly pattern = /blog\.csdn\.net\/.+\/article\/details\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 78;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const metadata = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['-CSDN博客', '_CSDN博客', '- CSDN博客'],
    });

    return {
      ...metadata,
      sourceType: 'website',
      sourceDomain,
    };
  }
}

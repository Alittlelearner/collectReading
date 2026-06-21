import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  extractNextData,
  parseDateValue,
  splitKeywords,
} from './articleMetadata';

export class SegmentFaultExtractor implements Extractor {
  readonly id = 'segmentfault';
  readonly displayName = 'SegmentFault';
  readonly pattern = /segmentfault\.com\/a\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 73;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['- SegmentFault 思否', ' - SegmentFault 思否'],
    });
    const nextData = extractNextData(html);
    const article = nextData?.props?.pageProps?.initialState?.articleDetail?.artDetail
      ? Object.values(nextData.props.pageProps.initialState.articleDetail.artDetail)[0]
      : null;
    const detail = (article as any)?.article || null;

    return {
      title: base.title,
      description: detail?.excerpt || base.description,
      imageUrl: detail?.cover || base.imageUrl,
      author: base.author || detail?.user_name || null,
      sourceType: 'website',
      sourceDomain,
      originalTags:
        base.originalTags.length > 0
          ? base.originalTags
          : splitKeywords(detail?.keywords || (article as any)?.keywords || ''),
      publishedAt: base.publishedAt || parseDateValue(detail?.created || (article as any)?.datePublished),
    };
  }
}

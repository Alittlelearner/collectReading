import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml, createEmptyArticleMetadata } from './articleMetadata';

export class HuxiuExtractor implements Extractor {
  readonly id = 'huxiu';
  readonly displayName = '虎嗅';
  readonly pattern = /huxiu\.com\/article\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 76;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;

    const metadata = this.isWafPage(html)
      ? createEmptyArticleMetadata()
      : createArticleMetadataFromGenericHtml(html, {
          titleSuffixes: ['-虎嗅网', '- 虎嗅网'],
        });

    return {
      ...metadata,
      sourceType: 'website',
      sourceDomain,
    };
  }

  private isWafPage(html: string): boolean {
    return html.includes('aliyun_waf') || html.includes('验证码') || html.includes('captcha');
  }
}

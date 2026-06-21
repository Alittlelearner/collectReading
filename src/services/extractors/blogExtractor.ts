import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import { createArticleMetadataFromGenericHtml, splitKeywords } from './articleMetadata';

export class BlogExtractor implements Extractor {
  readonly id = 'blog';
  readonly displayName = '博客文章';
  readonly pattern =
    /ruanyifeng\.com\/blog\/|\/posts?\/|\/article\/|\/archives?\/|\/\d{4}\/\d{2}\//i;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 40;

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (/ruanyifeng\.com$/i.test(parsed.hostname)) {
        return /\/blog\//i.test(parsed.pathname);
      }

      if (/medium\.com|bilibili\.com|zhihu\.com|juejin\.cn|github\.com|segmentfault\.com|36kr\.com/i.test(parsed.hostname)) {
        return false;
      }

      return (
        /\/posts?\//i.test(parsed.pathname) ||
        /\/article\//i.test(parsed.pathname) ||
        /\/archives?\//i.test(parsed.pathname) ||
        /\/\d{4}\/\d{2}\//.test(parsed.pathname)
      );
    } catch {
      return false;
    }
  }

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const metadata = createArticleMetadataFromGenericHtml(html);

    return {
      title: metadata.title,
      description: metadata.description,
      imageUrl: metadata.imageUrl,
      author: metadata.author,
      sourceType: 'website',
      sourceDomain,
      originalTags: metadata.originalTags.length > 0 ? metadata.originalTags : this.extractTags(html),
      publishedAt: metadata.publishedAt,
    };
  }

  private extractTags(html: string): string[] {
    const match = html.match(/<meta[^>]+name="keywords"[^>]+content="([^"]+)"/i);
    return match?.[1] ? splitKeywords(match[1].replace(/，/g, ',')) : [];
  }
}

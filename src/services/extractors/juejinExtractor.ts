import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchWithTimeout } from '../network';

export class JuejinExtractor implements Extractor {
  readonly id = 'juejin';
  readonly displayName = '掘金';
  readonly pattern = /juejin\.cn\/post\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = false;
  readonly priority = 90;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;

    try {
      const articleId = this.extractArticleId(url);
      if (!articleId) return this.emptyResult(url, sourceDomain);

      const response = await fetchWithTimeout(
        'https://api.juejin.cn/content_api/v1/article/detail',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: articleId }),
        },
        5000,
      );
      const json = await response.json();

      if (json.err_no !== 0 || !json.data?.article_info) {
        return this.emptyResult(url, sourceDomain);
      }

      const article = json.data.article_info;

      return {
        title: article.title || '',
        description: article.brief_content || '',
        imageUrl: article.cover_image || null,
        author: article.author_user_info?.user_name || null,
        sourceType: 'website',
        sourceDomain,
        originalTags: this.extractTags(json.data),
        publishedAt: this.toMillis(article.ctime || article.mtime),
      };
    } catch {
      return this.emptyResult(url, sourceDomain);
    }
  }

  private extractArticleId(url: string): string | null {
    const match = url.match(/\/post\/(\d+)/);
    return match ? match[1] : null;
  }

  private emptyResult(url: string, sourceDomain: string): ExtractedMetadata {
    return {
      title: '',
      description: '',
      imageUrl: null,
      author: null,
      sourceType: 'website',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }

  private extractTags(data: any): string[] {
    const tags = data?.tags || data?.tag_list || [];
    if (!Array.isArray(tags)) return [];
    return tags
      .map((tag: any) => tag?.tag_name || tag?.name)
      .filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }

  private toMillis(value: unknown): number | null {
    if (typeof value !== 'number') return null;
    return value > 1000000000000 ? value : value * 1000;
  }
}

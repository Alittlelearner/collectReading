import { Extractor, ExtractedMetadata, SourceType } from './types';

export class JuejinExtractor implements Extractor {
  readonly pattern = /juejin\.cn\/post\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = false;

  async extract(url: string, _html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    try {
      const articleId = this.extractArticleId(url);
      if (!articleId) return this.emptyResult(url, sourceDomain);

      const response = await fetch('https://api.juejin.cn/content_api/v1/article/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
        signal: AbortSignal.timeout(5000),
      });
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
    };
  }
}

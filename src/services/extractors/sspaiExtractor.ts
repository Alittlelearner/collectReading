import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchJsonWithTimeout } from '../network';

export class SspaiExtractor implements Extractor {
  readonly id = 'sspai';
  readonly displayName = '少数派';
  readonly pattern = /sspai\.com\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 60;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;
    const articleId = this.extractArticleId(url);

    if (articleId) {
      try {
        const json = await fetchJsonWithTimeout<any>(
          `https://sspai.com/api/v1/article/info/get?id=${encodeURIComponent(articleId)}`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Mozilla/5.0',
            },
          },
          8000,
        );

        const article = json?.data;
        if (article) {
          return {
            title: article.title || '',
            description: article.summary || this.extractSummaryFromBody(article.body || ''),
            imageUrl: article.banner
              ? `https://cdnfile.sspai.com/${article.banner}`
              : this.extractImageFromBody(article.body || ''),
            author: article.author?.nickname || article.author?.username || null,
            sourceType: 'website',
            sourceDomain,
            originalTags: this.extractTags(article),
            publishedAt: this.toMillis(article.released_at || article.created_at || article.modify_at),
          };
        }
      } catch {}
    }

    const html = context.html || '';

    return {
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html),
      sourceType: 'website',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }

  private extractArticleId(url: string): string | null {
    const match = url.match(/\/post\/(\d+)/);
    return match ? match[1] : null;
  }

  private extractTitle(html: string): string {
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle.replace(/\s*-\s*少数派$/, '').trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/\s*-\s*少数派$/, '').trim() : '';
  }

  private extractDescription(html: string): string {
    return this.extractMeta(html, 'og:description') || this.extractMeta(html, 'description') || '';
  }

  private extractImage(html: string): string | null {
    return this.extractMeta(html, 'og:image');
  }

  private extractAuthor(html: string): string | null {
    return this.extractMeta(html, 'article:author');
  }

  private extractSummaryFromBody(body: string): string {
    return body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
  }

  private extractImageFromBody(body: string): string | null {
    const match = body.match(/<(?:img)[^>]+(?:data-original|src)=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  private extractTags(article: any): string[] {
    const tags = article?.keywords || article?.tags || [];
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }

  private toMillis(value: unknown): number | null {
    if (typeof value !== 'number') {
      return null;
    }

    return value > 1000000000000 ? value : value * 1000;
  }
}

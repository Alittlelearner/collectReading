import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchTextWithTimeout } from '../network';
import { normalizeImageUrl } from '../../utils/media';

const MOBILE_ZHIHU_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

export class ZhihuExtractor implements Extractor {
  readonly id = 'zhihu';
  readonly displayName = '知乎';
  readonly pattern = /zhihu\.com\//;
  readonly sourceType: SourceType = 'zhihu';
  readonly needsHTML = true;
  readonly priority = 80;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;
    const html = await this.getBestHtml(url, context.html || '');

    const state = this.extractState(html);
    const stateMetadata = this.extractFromState(state, url, sourceDomain);

    return {
      title: stateMetadata.title || this.extractMeta(html, 'og:title') || this.extractTag(html, 'title'),
      description:
        stateMetadata.description ||
        this.extractMeta(html, 'og:description') ||
        this.extractMeta(html, 'description') ||
        '',
      imageUrl: normalizeImageUrl(stateMetadata.imageUrl || this.extractMeta(html, 'og:image')),
      author: stateMetadata.author || this.extractAuthor(html),
      sourceType: 'zhihu',
      sourceDomain,
      originalTags: stateMetadata.originalTags,
      publishedAt: stateMetadata.publishedAt,
    };
  }

  private async getBestHtml(url: string, html: string): Promise<string> {
    if (this.hasUsefulState(html)) {
      return html;
    }

    const mobileUrl = this.toMobileUrl(url);
    try {
      const mobileHtml = await fetchTextWithTimeout(
        mobileUrl,
        {
          headers: {
            'User-Agent': MOBILE_ZHIHU_UA,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        8000,
      );

      return this.hasUsefulState(mobileHtml) ? mobileHtml : html;
    } catch {
      return html;
    }
  }

  private toMobileUrl(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.hostname = 'm.zhihu.com';
      return parsed.toString();
    } catch {
      return url;
    }
  }

  private hasUsefulState(html: string): boolean {
    return html.includes('initialState') || html.includes('"entities"');
  }

  private extractState(html: string): any | null {
    const marker = '"initialState":';
    const start = html.indexOf(marker);
    if (start === -1) {
      return null;
    }

    const from = start + marker.length;
    const end = html.indexOf(',"subAppName"', from);
    if (end === -1) {
      return null;
    }

    try {
      return JSON.parse(html.slice(from, end));
    } catch {
      return null;
    }
  }

  private extractFromState(state: any, url: string, sourceDomain: string): ExtractedMetadata {
    const empty = this.emptyResult(sourceDomain);
    if (!state) {
      return empty;
    }

    const answerId = this.extractAnswerId(url);
    if (answerId) {
      const answer = this.findById(state, 'answers', answerId);
      if (answer) {
        return {
          title: answer.question?.title || answer.title || '',
          description: this.cleanText(answer.excerpt || answer.summary || ''),
          imageUrl: answer.thumbnail || answer.cover || answer.question?.thumbnail || null,
          author: answer.author?.name || null,
          sourceType: 'zhihu',
          sourceDomain,
          originalTags: [],
          publishedAt: this.toMillis(answer.created_time || answer.updated_time),
        };
      }
    }

    const questionId = this.extractQuestionId(url);
    if (questionId) {
      const question = this.findById(state, 'questions', questionId);
      if (question) {
        return {
          title: question.title || '',
          description: this.cleanText(question.excerpt || question.detail || ''),
          imageUrl: question.thumbnail || question.cover || null,
          author: question.author?.name || null,
          sourceType: 'zhihu',
          sourceDomain,
          originalTags: Array.isArray(question.topics)
            ? question.topics
                .map((topic: any) => topic?.name)
                .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
            : [],
          publishedAt: this.toMillis(question.created || question.updated_time),
        };
      }
    }

    const articleId = this.extractArticleId(url);
    if (articleId) {
      const article = this.findById(state, 'articles', articleId);
      if (article) {
        return {
          title: article.title || '',
          description: this.cleanText(article.excerpt || article.summary || ''),
          imageUrl: article.titleImage || article.image_url || article.cover || null,
          author: article.author?.name || null,
          sourceType: 'zhihu',
          sourceDomain,
          originalTags: [],
          publishedAt: this.toMillis(article.created || article.updated),
        };
      }
    }

    return empty;
  }

  private findById(state: any, collectionName: string, id: string): any | null {
    const collection = state?.entities?.[collectionName];
    if (!collection || typeof collection !== 'object') {
      return null;
    }

    return collection[id] || collection[String(id)] || null;
  }

  private extractQuestionId(url: string): string | null {
    const match = url.match(/question\/(\d+)/);
    return match ? match[1] : null;
  }

  private extractAnswerId(url: string): string | null {
    const match = url.match(/answer\/(\d+)/);
    return match ? match[1] : null;
  }

  private extractArticleId(url: string): string | null {
    const match = url.match(/\/p\/(\d+)/);
    return match ? match[1] : null;
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }

  private extractTag(html: string, tag: string): string {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }

  private extractAuthor(html: string): string | null {
    return this.extractMeta(html, 'article:author');
  }

  private cleanText(value: string): string {
    return value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toMillis(value: unknown): number | null {
    if (typeof value !== 'number') {
      return null;
    }

    return value > 1000000000000 ? value : value * 1000;
  }

  private emptyResult(sourceDomain: string): ExtractedMetadata {
    return {
      title: '',
      description: '',
      imageUrl: null,
      author: null,
      sourceType: 'zhihu',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }
}

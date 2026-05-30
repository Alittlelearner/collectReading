import { Extractor, ExtractedMetadata, SourceType } from './types';

export class DoubanExtractor implements Extractor {
  readonly pattern = /douban\.com\//;
  readonly sourceType: SourceType = 'other';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;
    const subjectType = this.detectSubjectType(url);

    return {
      title: this.extractTitle(html, subjectType),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html, subjectType),
      sourceType: 'other',
      sourceDomain,
    };
  }

  private detectSubjectType(url: string): 'book' | 'movie' | 'music' | 'unknown' {
    if (/douban\.com\/subject\/\d+/.test(url)) {
      if (url.includes('/book/')) return 'book';
      if (url.includes('/movie/')) return 'movie';
      if (url.includes('/music/')) return 'music';
    }
    return 'unknown';
  }

  private extractTitle(html: string, subjectType: string): string {
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    // 豆瓣书籍/电影/音乐的特殊结构
    if (subjectType !== 'unknown') {
      const h1Match = html.match(/<h1[^>]*><span[^>]*property="v:itemreviewed"[^>]*>([^<]+)<\/span><\/h1>/i);
      if (h1Match && h1Match[1]) return h1Match[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].replace(/ - 豆瓣$/, '').trim();

    return '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    // 豆瓣内容简介
    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    if (descMatch) return descMatch[1];

    return '';
  }

  private extractImage(html: string): string | null {
    const ogImage = this.extractMeta(html, 'og:image');
    if (ogImage) return ogImage;

    // 豆瓣封面图
    const coverMatch = html.match(/<img[^>]+alt="[^"]*"[^>]+src="([^"]+\.jpg)"[^>]*>/i);
    if (coverMatch) return coverMatch[1];

    return null;
  }

  private extractAuthor(html: string, subjectType: string): string | null {
    if (subjectType === 'book') {
      const authorMatch = html.match(/<span[^>]*class="pl">作者<\/span>[^>]*([^<]+)<\/a>/i);
      if (authorMatch && authorMatch[1]) return authorMatch[1].trim();
    }
    if (subjectType === 'movie') {
      const directorMatch = html.match(/<span[^>]*class="pl">导演<\/span>[^>]*([^<]+)<\/a>/i);
      if (directorMatch && directorMatch[1]) return directorMatch[1].trim();
    }

    const metaAuthor = this.extractMeta(html, 'article:author');
    if (metaAuthor) return metaAuthor;

    return null;
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }
}

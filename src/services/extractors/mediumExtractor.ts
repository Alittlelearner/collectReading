import { Extractor, ExtractedMetadata, SourceType } from './types';

export class MediumExtractor implements Extractor {
  readonly pattern = /medium\.com\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    return {
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html),
      sourceType: 'website',
      sourceDomain,
    };
  }

  private extractTitle(html: string): string {
    // Medium 使用 meta[property="og:title"] 或 data-rh 属性
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    // Medium 的 data-rh="true" 标签包含标题
    const rhTitle = html.match(/<title[^>]*data-rh="true"[^>]*>([^<]+)<\/title>/i);
    if (rhTitle && rhTitle[1]) return rhTitle[1].trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) return titleMatch[1].replace(/ - Medium$/, '').trim();

    return '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    // Medium 的 meta description
    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    if (descMatch) return descMatch[1];

    return '';
  }

  private extractImage(html: string): string | null {
    // Medium 使用 og:image 或 data-rh="true" 的图片
    const ogImage = this.extractMeta(html, 'og:image');
    if (ogImage) return ogImage;

    // 查找最大图片（通常是文章封面）
    const imageMatch = html.match(/<meta[^>]+property="twitter:image"[^>]+content="([^"]+)"/i);
    if (imageMatch) return imageMatch[1];

    return null;
  }

  private extractAuthor(html: string): string | null {
    // Medium 使用 og:author 或 article:author
    const ogAuthor = this.extractMeta(html, 'article:author');
    if (ogAuthor) return ogAuthor;

    // 从页面 JSON 数据中提取作者
    const authorMatch = html.match(/<meta[^>]+name="author"[^>]+content="([^"]+)"/i);
    if (authorMatch) return authorMatch[1];

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

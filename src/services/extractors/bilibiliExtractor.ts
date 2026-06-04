import { Extractor, ExtractedMetadata, SourceType } from './types';

export class BilibiliExtractor implements Extractor {
  readonly pattern = /bilibili\.com|b23\.tv/;
  readonly sourceType: SourceType = 'bilibili';
  readonly needsHTML = true;

  async extract(url: string, html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    // 从 HTML 中提取标题
    if (html && html.length > 100) {
      // 方法1: 从 <title> 标签提取
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/\s*_哔哩哔哩\s*$/, '').trim();
        if (title) {
          return {
            title,
            description: '',
            imageUrl: null,
            author: null,
            sourceType: 'bilibili',
            sourceDomain,
          };
        }
      }

      // 方法2: 从 og:title meta 标签提取
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        return {
          title: ogTitleMatch[1].trim(),
          description: '',
          imageUrl: null,
          author: null,
          sourceType: 'bilibili',
          sourceDomain,
        };
      }
    }

    // 无法获取标题，使用 URL 中的信息
    const bvid = this.extractBVID(url);
    if (bvid) {
      return {
        title: `B站视频 ${bvid}`,
        description: '',
        imageUrl: null,
        author: null,
        sourceType: 'bilibili',
        sourceDomain,
      };
    }

    return this.emptyResult(url, sourceDomain);
  }

  private extractBVID(url: string): string | null {
    const match = url.match(/BV[a-zA-Z0-9]+/);
    return match ? match[0] : null;
  }

  private emptyResult(url: string, sourceDomain: string): ExtractedMetadata {
    return {
      title: '',
      description: '',
      imageUrl: null,
      author: null,
      sourceType: 'bilibili',
      sourceDomain,
    };
  }
}

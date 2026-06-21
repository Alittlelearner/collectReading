import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchTextWithTimeout } from '../network';
import { normalizeImageUrl } from '../../utils/media';

const MOBILE_JIKE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

export class JikeExtractor implements Extractor {
  readonly id = 'jike';
  readonly displayName = '即刻';
  readonly pattern = /okjike\.com\//;
  readonly sourceType: SourceType = 'jike';
  readonly needsHTML = true;
  readonly priority = 82;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;
    const html = await this.getBestHtml(url, context.html || '');
    const nextData = this.extractNextData(html);
    const post = nextData?.props?.pageProps?.post;

    return {
      title:
        this.cleanText(post?.content).split('\n').find(Boolean)?.trim() ||
        this.extractMeta(html, 'og:title') ||
        this.extractTag(html, 'title'),
      description:
        this.cleanText(post?.content) ||
        this.extractMeta(html, 'og:description') ||
        this.extractMeta(html, 'description') ||
        '',
      imageUrl: normalizeImageUrl(this.extractImage(post) || this.extractMeta(html, 'og:image')),
      author: post?.user?.screenName || post?.user?.nickname || post?.user?.username || null,
      sourceType: 'jike',
      sourceDomain,
      originalTags: this.extractTopics(post),
      publishedAt: this.parseDate(post?.createdAt),
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
            'User-Agent': MOBILE_JIKE_UA,
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
      parsed.hostname = 'm.okjike.com';
      const match = parsed.pathname.match(/\/(originalPosts|posts|reposts)\/([^/?#]+)/i);
      if (match) {
        parsed.pathname = `/${match[1]}/${match[2]}`;
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  private hasUsefulState(html: string): boolean {
    return html.includes('__NEXT_DATA__') && html.includes('"post"');
  }

  private extractNextData(html: string): any | null {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
    if (!match?.[1]) {
      return null;
    }

    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  private extractImage(post: any): string | null {
    const media = post?.pictureImages?.[0] || post?.images?.[0];
    const candidate =
      media?.picUrl ||
      media?.url ||
      media?.middlePicUrl ||
      media?.smallPicUrl ||
      media?.thumbnailUrl ||
      post?.video?.image?.picUrl ||
      post?.video?.image?.thumbnailUrl ||
      post?.video?.thumbnailUrl;

    return typeof candidate === 'string' ? candidate : null;
  }

  private extractTopics(post: any): string[] {
    const topics = new Set<string>();
    const topic = post?.topic;
    const topicName = topic?.content || topic?.name;
    if (typeof topicName === 'string' && topicName.trim()) {
      topics.add(topicName.trim());
    }

    const communities = post?.communities;
    if (Array.isArray(communities)) {
      communities
        .map((item: any) => item?.name || item?.title)
        .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
        .forEach((name) => topics.add(name.trim()));
    }

    return Array.from(topics);
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? this.decodeHtmlEntities(match[1]) : null;
  }

  private extractTag(html: string, tag: string): string {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
    return match ? this.decodeHtmlEntities(match[1].trim()) : '';
  }

  private decodeHtmlEntities(value: string): string {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  private cleanText(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
  }

  private parseDate(value: unknown): number | null {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}

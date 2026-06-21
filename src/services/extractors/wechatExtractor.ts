import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';

export class WechatExtractor implements Extractor {
  readonly id = 'wechat';
  readonly displayName = '微信公众号';
  readonly pattern = /mp\.weixin\.qq\.com\//;
  readonly sourceType: SourceType = 'wechat';
  readonly needsHTML = true;
  readonly priority = 85;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;

    return {
      title: this.extractScriptValue(html, ['msg_title', 'window.msg_title']) || this.extractTag(html, 'title'),
      description:
        this.extractScriptValue(html, ['msg_desc', 'window.msg_desc']) ||
        this.extractMeta(html, 'description') ||
        '',
      imageUrl:
        this.extractScriptValue(html, ['msg_cdn_url', 'window.msg_cdn_url']) ||
        this.extractScriptValue(html, ['ori_head_img_url']) ||
        this.extractMeta(html, 'og:image'),
      author:
        this.extractScriptValue(html, ['nickname', 'user_name']) ||
        this.extractMeta(html, 'author') ||
        null,
      sourceType: 'wechat',
      sourceDomain,
      originalTags: [],
      publishedAt: this.toMillis(this.extractScriptNumber(html, ['publish_time', 'ct'])),
    };
  }

  private extractScriptValue(html: string, keys: string[]): string | null {
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`${escaped}\\s*=\\s*["']([^"']+)["']`, 'i'),
        new RegExp(`${escaped}\\s*:\\s*["']([^"']+)["']`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          return this.decodeJsString(match[1]);
        }
      }
    }

    return null;
  }

  private extractScriptNumber(html: string, keys: string[]): number | null {
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`${escaped}\\s*=\\s*(\\d+)`, 'i'),
        new RegExp(`${escaped}\\s*:\\s*(\\d+)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          return Number(match[1]);
        }
      }
    }

    return null;
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

  private decodeJsString(value: string): string {
    return value
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\n/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .trim();
  }

  private toMillis(value: number | null): number | null {
    if (!value) {
      return null;
    }

    return value > 1000000000000 ? value : value * 1000;
  }
}

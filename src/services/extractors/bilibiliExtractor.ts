import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { Platform } from 'react-native';
import { fetchJsonWithTimeout, fetchJsonp } from '../network';

export class BilibiliExtractor implements Extractor {
  readonly id = 'bilibili';
  readonly displayName = 'Bilibili';
  readonly pattern = /bilibili\.com\/video\//;
  readonly sourceType: SourceType = 'bilibili';
  readonly needsHTML = false;
  readonly priority = 100;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;

    try {
      const bvid = this.extractBVID(url);
      if (!bvid) return this.emptyResult(url, sourceDomain);

      const json = await this.fetchViewData(bvid);

      if (json.code !== 0 || !json.data) {
        return this.emptyResult(url, sourceDomain);
      }

      const tags = await this.fetchTags(bvid);
      const normalizedDescription = this.normalizeDescription(json.data.desc);

      return {
        title: json.data.title || '',
        description: normalizedDescription,
        imageUrl: this.normalizeCoverUrl(json.data.pic),
        author: json.data.owner?.name || null,
        sourceType: 'bilibili',
        sourceDomain,
        originalTags: tags,
        publishedAt: typeof json.data.pubdate === 'number' ? json.data.pubdate * 1000 : null,
      };
    } catch {
      return this.emptyResult(url, sourceDomain);
    }
  }

  private extractBVID(url: string): string | null {
    const match = url.match(/BV[a-zA-Z0-9]+/);
    return match ? match[0] : null;
  }

  private async fetchTags(bvid: string): Promise<string[]> {
    try {
      const json = await this.fetchBilibiliJson(
        `https://api.bilibili.com/x/tag/archive/tags?bvid=${encodeURIComponent(bvid)}`,
      );
      if (json.code !== 0 || !Array.isArray(json.data)) return [];
      return json.data
        .map((tag: any) => tag?.tag_name)
        .filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    } catch {
      return [];
    }
  }

  private async fetchViewData(bvid: string): Promise<any> {
    return this.fetchBilibiliJson(
      `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
    );
  }

  private normalizeDescription(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed || trimmed === '-' || trimmed === '--' || trimmed === '—') {
      return '';
    }
    return trimmed;
  }

  private normalizeCoverUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`;
    return trimmed;
  }

  private async fetchBilibiliJson(url: string): Promise<any> {
    if (Platform.OS === 'web') {
      return fetchJsonp(url, { callbackParam: 'callback', timeoutMs: 5000 });
    }

    return fetchJsonWithTimeout(
      url,
      {
        headers: {
          Accept: 'application/json',
          Referer: 'https://www.bilibili.com/',
          Origin: 'https://www.bilibili.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      5000,
    );
  }

  private emptyResult(url: string, sourceDomain: string): ExtractedMetadata {
    return {
      title: '',
      description: '',
      imageUrl: null,
      author: null,
      sourceType: 'bilibili',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }
}

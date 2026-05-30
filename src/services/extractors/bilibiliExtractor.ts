import { Extractor, ExtractedMetadata, SourceType } from './types';

export class BilibiliExtractor implements Extractor {
  readonly pattern = /bilibili\.com\/video\//;
  readonly sourceType: SourceType = 'bilibili';
  readonly needsHTML = false;

  async extract(url: string, _html: string): Promise<ExtractedMetadata> {
    const sourceDomain = new URL(url).hostname;

    try {
      const bvid = this.extractBVID(url);
      if (!bvid) return this.emptyResult(url, sourceDomain);

      const response = await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const json = await response.json();

      if (json.code !== 0 || !json.data) {
        return this.emptyResult(url, sourceDomain);
      }

      return {
        title: json.data.title || '',
        description: json.data.desc || '',
        imageUrl: json.data.pic || null,
        author: json.data.owner?.name || null,
        sourceType: 'bilibili',
        sourceDomain,
      };
    } catch {
      return this.emptyResult(url, sourceDomain);
    }
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

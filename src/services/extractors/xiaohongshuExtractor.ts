import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';

export class XiaohongshuExtractor implements Extractor {
  readonly id = 'xiaohongshu';
  readonly displayName = '小红书';
  readonly pattern = /xiaohongshu\.com|xhslink\.com/;
  readonly sourceType: SourceType = 'other';
  readonly needsHTML = true;
  readonly priority = 75;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const state = this.extractState(html);
    const note = this.extractNoteFromState(state);

    return {
      title: note?.title || this.extractTitle(html),
      description: note?.desc || this.extractDescription(html),
      imageUrl: this.extractImageFromNote(note) || this.extractImage(html),
      author: note?.user?.nickname || note?.user?.nickName || this.extractAuthor(html),
      sourceType: 'other',
      sourceDomain,
      originalTags: this.extractTagsFromNote(note),
      publishedAt: this.toMillis(note?.time || note?.lastUpdateTime),
    };
  }

  private extractState(html: string): any | null {
    const match = html.match(/window\.__INITIAL_STATE__=(\{[\s\S]*?\})<\/script>/i);
    if (!match?.[1]) {
      return null;
    }

    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  private extractNoteFromState(state: any): any | null {
    const noteDetailMap = state?.note?.noteDetailMap;
    if (!noteDetailMap || typeof noteDetailMap !== 'object') {
      return null;
    }

    const candidate = Object.values(noteDetailMap).find(
      (item: any) => item?.note && Object.keys(item.note).length > 0,
    ) as any;

    return candidate?.note || null;
  }

  private extractTitle(html: string): string {
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.name) return json.name;
        if (json.headline) return json.headline;
      } catch {}
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/\s*-\s*小红书\s*$/, '').trim() : '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.description) return json.description;
      } catch {}
    }

    return '';
  }

  private extractImage(html: string): string | null {
    const ogImage = this.extractMeta(html, 'og:image');
    if (ogImage) return ogImage;

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.image) {
          return typeof json.image === 'string' ? json.image : json.image.url;
        }
      } catch {}
    }

    return null;
  }

  private extractImageFromNote(note: any): string | null {
    const firstImage =
      note?.imageList?.[0]?.urlDefault ||
      note?.imageList?.[0]?.urlPre ||
      note?.imageList?.[0]?.url ||
      note?.cover?.urlDefault ||
      note?.cover?.urlPre;

    return typeof firstImage === 'string' ? firstImage : null;
  }

  private extractAuthor(html: string): string | null {
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const json = JSON.parse(jsonLdMatch[1]);
        if (json.author) {
          return typeof json.author === 'string' ? json.author : json.author.name;
        }
      } catch {}
    }

    return this.extractMeta(html, 'article:author');
  }

  private extractTagsFromNote(note: any): string[] {
    const tags = note?.tagList || note?.hashTagList || [];
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags
      .map((tag: any) => tag?.name || tag?.tagName)
      .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0);
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

import { ExtractedMetadata, Extractor, ExtractorContext, SourceType } from './types';
import {
  createArticleMetadataFromGenericHtml,
  decodeHtmlEntities,
  extractNextData,
  parseDateValue,
} from './articleMetadata';

export class JianshuExtractor implements Extractor {
  readonly id = 'jianshu';
  readonly displayName = '简书';
  readonly pattern = /jianshu\.com\/p\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 75;

  async extract(_url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const html = context.html || '';
    const sourceDomain = context.sourceDomain;
    const base = createArticleMetadataFromGenericHtml(html, {
      titleSuffixes: ['- 简书', ' - 简书'],
    });
    const nextData = extractNextData(html);
    const note = this.extractNote(nextData);
    const noteData = note?.data || note;

    return {
      title: base.title || noteData?.public_title || '',
      description: base.description || this.extractDescription(noteData),
      imageUrl: base.imageUrl || noteData?.share_image_url || null,
      author: base.author || noteData?.user?.nickname || noteData?.user?.slug || null,
      sourceType: 'website',
      sourceDomain,
      originalTags: base.originalTags,
      publishedAt: base.publishedAt || parseDateValue(noteData?.publicize_at || noteData?.first_shared_at),
    };
  }

  private extractNote(nextData: any): any | null {
    const state = nextData?.props?.initialState || nextData?.props?.pageProps?.initialState;
    if (!state || typeof state !== 'object') {
      return null;
    }

    if (state.note && typeof state.note === 'object') {
      return state.note;
    }

    const noteMap = state.entities?.notes || state.entities?.note;
    if (noteMap && typeof noteMap === 'object') {
      const first = Object.values(noteMap).find((item: any) => item && typeof item === 'object');
      return first || null;
    }

    return null;
  }

  private extractDescription(noteData: any): string {
    const source = noteData?.description || noteData?.free_content || '';
    if (typeof source !== 'string') {
      return '';
    }

    return decodeHtmlEntities(source.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 200);
  }
}

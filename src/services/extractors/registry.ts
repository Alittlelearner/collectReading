import { SourceType, Extractor } from './types';

export class ExtractorRegistry {
  private extractors: Extractor[] = [];

  register(extractor: Extractor): void {
    this.extractors.push(extractor);
    this.extractors.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  resolve(url: string): Extractor {
    for (const extractor of this.extractors) {
      if (this.matches(extractor, url)) {
        return extractor;
      }
    }
    throw new Error(`No extractor found for URL: ${url}`);
  }

  getSourceType(url: string): SourceType {
    for (const extractor of this.extractors) {
      if (this.matches(extractor, url)) {
        return extractor.sourceType;
      }
    }
    return 'other';
  }

  listRoutes(): Array<{ id: string; displayName: string; sourceType: SourceType }> {
    return this.extractors.map((extractor) => ({
      id: extractor.id,
      displayName: extractor.displayName,
      sourceType: extractor.sourceType,
    }));
  }

  listApiBackedRoutes(): Array<{ id: string; displayName: string; sourceType: SourceType }> {
    return this.extractors
      .filter(
        (extractor) =>
          extractor.id === 'bilibili' ||
          extractor.id === 'juejin' ||
          extractor.id === 'github' ||
          extractor.id === 'sspai',
      )
      .map((extractor) => ({
        id: extractor.id,
        displayName: extractor.displayName,
        sourceType: extractor.sourceType,
      }));
  }

  listPublicDetailRoutes(): Array<{ id: string; displayName: string; sourceType: SourceType }> {
    return this.extractors
      .filter(
        (extractor) =>
          extractor.id === 'bilibili' ||
          extractor.id === 'csdn' ||
          extractor.id === '36kr' ||
          extractor.id === 'huxiu' ||
          extractor.id === 'jianshu' ||
          extractor.id === 'cnblogs' ||
          extractor.id === 'segmentfault' ||
          extractor.id === 'infoq' ||
          extractor.id === 'woshipm' ||
          extractor.id === 'zhihu' ||
          extractor.id === 'juejin' ||
          extractor.id === 'github' ||
          extractor.id === 'sspai' ||
          extractor.id === 'medium' ||
          extractor.id === 'jike' ||
          extractor.id === 'xueqiu' ||
          extractor.id === 'telegram' ||
          extractor.id === 'youtube' ||
          extractor.id === 'twitter' ||
          extractor.id === 'blog',
      )
      .map((extractor) => ({
        id: extractor.id,
        displayName: extractor.displayName,
        sourceType: extractor.sourceType,
      }));
  }

  private matches(extractor: Extractor, url: string): boolean {
    if (extractor.canHandle) return extractor.canHandle(url);
    extractor.pattern.lastIndex = 0;
    return extractor.pattern.test(url);
  }
}

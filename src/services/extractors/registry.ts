import { SourceType, Extractor } from './types';

export class ExtractorRegistry {
  private extractors: Extractor[] = [];

  register(extractor: Extractor): void {
    this.extractors.push(extractor);
  }

  resolve(url: string): Extractor {
    for (const extractor of this.extractors) {
      if (extractor.pattern.test(url)) {
        return extractor;
      }
    }
    throw new Error(`No extractor found for URL: ${url}`);
  }

  getSourceType(url: string): SourceType {
    for (const extractor of this.extractors) {
      if (extractor.pattern.test(url)) {
        return extractor.sourceType;
      }
    }
    return 'other';
  }
}

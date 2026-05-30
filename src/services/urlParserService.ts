import { SourceType, ExtractedMetadata } from '../types';
import { ExtractorRegistry } from './extractors/registry';
import { GenericExtractor } from './extractors/genericExtractor';
import { BilibiliExtractor } from './extractors/bilibiliExtractor';
import { JuejinExtractor } from './extractors/juejinExtractor';
import { ZhihuExtractor } from './extractors/zhihuExtractor';
import { WechatExtractor } from './extractors/wechatExtractor';
import { DoubanExtractor } from './extractors/doubanExtractor';
import { SspaiExtractor } from './extractors/sspaiExtractor';
import { MediumExtractor } from './extractors/mediumExtractor';
import { GitHubExtractor } from './extractors/githubExtractor';
import { XiaohongshuExtractor } from './extractors/xiaohongshuExtractor';

const registry = new ExtractorRegistry();
// 按优先级注册：特定平台优先，通用回退最后
registry.register(new BilibiliExtractor());
registry.register(new JuejinExtractor());
registry.register(new ZhihuExtractor());
registry.register(new WechatExtractor());
registry.register(new DoubanExtractor());
registry.register(new SspaiExtractor());
registry.register(new MediumExtractor());
registry.register(new GitHubExtractor());
registry.register(new XiaohongshuExtractor());
registry.register(new GenericExtractor()); // 最低优先级兜底

export class URLParserService {
  async parse(url: string): Promise<ExtractedMetadata> {
    const extractor = registry.resolve(url);
    const sourceDomain = this.detectSourceDomain(url);
    let html = '';

    if (extractor.needsHTML) {
      try {
        html = await this.fetchHTML(url);
      } catch {
        // HTML 抓取失败，使用空字符串传递给提取器
      }
    }

    const metadata = await extractor.extract(url, html);

    return {
      ...metadata,
      sourceDomain: metadata.sourceDomain || sourceDomain,
    };
  }

  detectSourceType(url: string): SourceType {
    return registry.getSourceType(url);
  }

  detectSourceDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private async fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkTracker/1.0)',
      },
    });
    return response.text();
  }
}

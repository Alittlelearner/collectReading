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
import { expandShortUrl } from '../utils/urlExpander';

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
    let finalUrl = url;
    try {
      finalUrl = await expandShortUrl(url);
    } catch (e) {
      console.log('[URLParser] Failed to expand URL:', e);
    }

    const extractor = registry.resolve(finalUrl);
    const sourceDomain = this.detectSourceDomain(finalUrl);
    let html = '';

    if (extractor.needsHTML) {
      try {
        html = await this.fetchHTML(finalUrl);
      } catch (e) {
        console.log('[URLParser] Failed to fetch HTML:', e);
      }
    }

    const metadata = await extractor.extract(finalUrl, html);

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
    // 使用 Jina AI 的免费抓取服务
    const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;

    try {
      const response = await fetch(jinaUrl, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'text/plain',
        },
      });
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.log('[URLParser] Jina fetch failed:', e);
    }

    throw new Error('Failed to fetch HTML');
  }
}

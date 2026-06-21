import { ExtractedMetadata, SourceType } from '../types';
import { normalizeImageUrl } from '../utils/media';
import { ExtractorRegistry } from './extractors/registry';
import { BilibiliExtractor } from './extractors/bilibiliExtractor';
import { BlogExtractor } from './extractors/blogExtractor';
import { CnblogsExtractor } from './extractors/cnblogsExtractor';
import { CsdnExtractor } from './extractors/csdnExtractor';
import { DoubanExtractor } from './extractors/doubanExtractor';
import { GenericExtractor } from './extractors/genericExtractor';
import { GitHubExtractor } from './extractors/githubExtractor';
import { HuxiuExtractor } from './extractors/huxiuExtractor';
import { InfoqExtractor } from './extractors/infoqExtractor';
import { JikeExtractor } from './extractors/jikeExtractor';
import { JianshuExtractor } from './extractors/jianshuExtractor';
import { JuejinExtractor } from './extractors/juejinExtractor';
import { Kr36Extractor } from './extractors/kr36Extractor';
import { MediumExtractor } from './extractors/mediumExtractor';
import { SegmentFaultExtractor } from './extractors/segmentFaultExtractor';
import { SspaiExtractor } from './extractors/sspaiExtractor';
import { TelegramExtractor } from './extractors/telegramExtractor';
import { TwitterExtractor } from './extractors/twitterExtractor';
import { WechatExtractor } from './extractors/wechatExtractor';
import { XiaohongshuExtractor } from './extractors/xiaohongshuExtractor';
import { XueqiuExtractor } from './extractors/xueqiuExtractor';
import { WoshipmExtractor } from './extractors/woshipmExtractor';
import { YoutubeExtractor } from './extractors/youtubeExtractor';
import { ZhihuExtractor } from './extractors/zhihuExtractor';
import { fetchTextWithTimeout } from './network';

const registry = new ExtractorRegistry();

// Specific platform parsers are registered before the generic fallback.
registry.register(new BilibiliExtractor());
registry.register(new JuejinExtractor());
registry.register(new ZhihuExtractor());
registry.register(new WechatExtractor());
registry.register(new DoubanExtractor());
registry.register(new SspaiExtractor());
registry.register(new CsdnExtractor());
registry.register(new Kr36Extractor());
registry.register(new HuxiuExtractor());
registry.register(new JianshuExtractor());
registry.register(new CnblogsExtractor());
registry.register(new SegmentFaultExtractor());
registry.register(new InfoqExtractor());
registry.register(new WoshipmExtractor());
registry.register(new MediumExtractor());
registry.register(new GitHubExtractor());
registry.register(new XiaohongshuExtractor());
registry.register(new JikeExtractor());
registry.register(new XueqiuExtractor());
registry.register(new TelegramExtractor());
registry.register(new YoutubeExtractor());
registry.register(new TwitterExtractor());
registry.register(new BlogExtractor());
registry.register(new GenericExtractor());

export class URLParserService {
  async parse(url: string): Promise<ExtractedMetadata> {
    const extractor = registry.resolve(url);
    const sourceDomain = this.detectSourceDomain(url);
    let html = '';

    if (extractor.needsHTML) {
      try {
        html = await this.fetchHTML(url);
      } catch {
        // Fall through so API-backed or fallback parsing can still continue.
      }
    }

    const metadata = await extractor.extract(url, { sourceDomain, html });

    return {
      title: metadata.title || sourceDomain || url,
      description: metadata.description || '',
      imageUrl: normalizeImageUrl(metadata.imageUrl),
      author: metadata.author || null,
      sourceType: metadata.sourceType,
      sourceDomain: metadata.sourceDomain || sourceDomain,
      originalTags: metadata.originalTags || [],
      publishedAt: metadata.publishedAt || null,
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

  listSupportedRoutes() {
    return registry.listRoutes();
  }

  listPublicApiRoutes() {
    return registry.listApiBackedRoutes();
  }

  listPublicDetailRoutes() {
    return registry.listPublicDetailRoutes();
  }

  private async fetchHTML(url: string): Promise<string> {
    return fetchTextWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkTracker/1.0)',
        },
      },
      5000,
    );
  }
}

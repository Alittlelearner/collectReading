"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLParserService = void 0;
const media_1 = require("../utils/media");
const registry_1 = require("./extractors/registry");
const bilibiliExtractor_1 = require("./extractors/bilibiliExtractor");
const blogExtractor_1 = require("./extractors/blogExtractor");
const cnblogsExtractor_1 = require("./extractors/cnblogsExtractor");
const csdnExtractor_1 = require("./extractors/csdnExtractor");
const doubanExtractor_1 = require("./extractors/doubanExtractor");
const genericExtractor_1 = require("./extractors/genericExtractor");
const githubExtractor_1 = require("./extractors/githubExtractor");
const huxiuExtractor_1 = require("./extractors/huxiuExtractor");
const infoqExtractor_1 = require("./extractors/infoqExtractor");
const jikeExtractor_1 = require("./extractors/jikeExtractor");
const jianshuExtractor_1 = require("./extractors/jianshuExtractor");
const juejinExtractor_1 = require("./extractors/juejinExtractor");
const kr36Extractor_1 = require("./extractors/kr36Extractor");
const mediumExtractor_1 = require("./extractors/mediumExtractor");
const segmentFaultExtractor_1 = require("./extractors/segmentFaultExtractor");
const sspaiExtractor_1 = require("./extractors/sspaiExtractor");
const telegramExtractor_1 = require("./extractors/telegramExtractor");
const twitterExtractor_1 = require("./extractors/twitterExtractor");
const wechatExtractor_1 = require("./extractors/wechatExtractor");
const xiaohongshuExtractor_1 = require("./extractors/xiaohongshuExtractor");
const xueqiuExtractor_1 = require("./extractors/xueqiuExtractor");
const woshipmExtractor_1 = require("./extractors/woshipmExtractor");
const youtubeExtractor_1 = require("./extractors/youtubeExtractor");
const zhihuExtractor_1 = require("./extractors/zhihuExtractor");
const network_1 = require("./network");
const registry = new registry_1.ExtractorRegistry();
// Specific platform parsers are registered before the generic fallback.
registry.register(new bilibiliExtractor_1.BilibiliExtractor());
registry.register(new juejinExtractor_1.JuejinExtractor());
registry.register(new zhihuExtractor_1.ZhihuExtractor());
registry.register(new wechatExtractor_1.WechatExtractor());
registry.register(new doubanExtractor_1.DoubanExtractor());
registry.register(new sspaiExtractor_1.SspaiExtractor());
registry.register(new csdnExtractor_1.CsdnExtractor());
registry.register(new kr36Extractor_1.Kr36Extractor());
registry.register(new huxiuExtractor_1.HuxiuExtractor());
registry.register(new jianshuExtractor_1.JianshuExtractor());
registry.register(new cnblogsExtractor_1.CnblogsExtractor());
registry.register(new segmentFaultExtractor_1.SegmentFaultExtractor());
registry.register(new infoqExtractor_1.InfoqExtractor());
registry.register(new woshipmExtractor_1.WoshipmExtractor());
registry.register(new mediumExtractor_1.MediumExtractor());
registry.register(new githubExtractor_1.GitHubExtractor());
registry.register(new xiaohongshuExtractor_1.XiaohongshuExtractor());
registry.register(new jikeExtractor_1.JikeExtractor());
registry.register(new xueqiuExtractor_1.XueqiuExtractor());
registry.register(new telegramExtractor_1.TelegramExtractor());
registry.register(new youtubeExtractor_1.YoutubeExtractor());
registry.register(new twitterExtractor_1.TwitterExtractor());
registry.register(new blogExtractor_1.BlogExtractor());
registry.register(new genericExtractor_1.GenericExtractor());
class URLParserService {
    async parse(url) {
        const extractor = registry.resolve(url);
        const sourceDomain = this.detectSourceDomain(url);
        let html = '';
        if (extractor.needsHTML) {
            try {
                html = await this.fetchHTML(url);
            }
            catch {
                // Fall through so API-backed or fallback parsing can still continue.
            }
        }
        const metadata = await extractor.extract(url, { sourceDomain, html });
        return {
            title: metadata.title || sourceDomain || url,
            description: metadata.description || '',
            imageUrl: (0, media_1.normalizeImageUrl)(metadata.imageUrl),
            author: metadata.author || null,
            sourceType: metadata.sourceType,
            sourceDomain: metadata.sourceDomain || sourceDomain,
            originalTags: metadata.originalTags || [],
            publishedAt: metadata.publishedAt || null,
        };
    }
    detectSourceType(url) {
        return registry.getSourceType(url);
    }
    detectSourceDomain(url) {
        try {
            return new URL(url).hostname;
        }
        catch {
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
    async fetchHTML(url) {
        return (0, network_1.fetchTextWithTimeout)(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BookmarkTracker/1.0)',
            },
        }, 5000);
    }
}
exports.URLParserService = URLParserService;

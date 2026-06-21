"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentFaultExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class SegmentFaultExtractor {
    constructor() {
        this.id = 'segmentfault';
        this.displayName = 'SegmentFault';
        this.pattern = /segmentfault\.com\/a\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 73;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['- SegmentFault 思否', ' - SegmentFault 思否'],
        });
        const nextData = (0, articleMetadata_1.extractNextData)(html);
        const article = nextData?.props?.pageProps?.initialState?.articleDetail?.artDetail
            ? Object.values(nextData.props.pageProps.initialState.articleDetail.artDetail)[0]
            : null;
        const detail = article?.article || null;
        return {
            title: base.title,
            description: detail?.excerpt || base.description,
            imageUrl: detail?.cover || base.imageUrl,
            author: base.author || detail?.user_name || null,
            sourceType: 'website',
            sourceDomain,
            originalTags: base.originalTags.length > 0
                ? base.originalTags
                : (0, articleMetadata_1.splitKeywords)(detail?.keywords || article?.keywords || ''),
            publishedAt: base.publishedAt || (0, articleMetadata_1.parseDateValue)(detail?.created || article?.datePublished),
        };
    }
}
exports.SegmentFaultExtractor = SegmentFaultExtractor;

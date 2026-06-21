"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JianshuExtractor = void 0;
const articleMetadata_1 = require("./articleMetadata");
class JianshuExtractor {
    constructor() {
        this.id = 'jianshu';
        this.displayName = '简书';
        this.pattern = /jianshu\.com\/p\//;
        this.sourceType = 'website';
        this.needsHTML = true;
        this.priority = 75;
    }
    async extract(_url, context) {
        const html = context.html || '';
        const sourceDomain = context.sourceDomain;
        const base = (0, articleMetadata_1.createArticleMetadataFromGenericHtml)(html, {
            titleSuffixes: ['- 简书', ' - 简书'],
        });
        const nextData = (0, articleMetadata_1.extractNextData)(html);
        const note = this.extractNote(nextData);
        return {
            title: base.title,
            description: base.description,
            imageUrl: base.imageUrl || note?.first_shared_at ? base.imageUrl : base.imageUrl,
            author: base.author || note?.user?.nickname || note?.user?.slug || null,
            sourceType: 'website',
            sourceDomain,
            originalTags: base.originalTags,
            publishedAt: base.publishedAt || (0, articleMetadata_1.parseDateValue)(note?.publicize_at || note?.first_shared_at),
        };
    }
    extractNote(nextData) {
        const state = nextData?.props?.initialState || nextData?.props?.pageProps?.initialState;
        if (!state || typeof state !== 'object') {
            return null;
        }
        if (state.note && typeof state.note === 'object') {
            return state.note;
        }
        const noteMap = state.entities?.notes || state.entities?.note;
        if (noteMap && typeof noteMap === 'object') {
            const first = Object.values(noteMap).find((item) => item && typeof item === 'object');
            return first || null;
        }
        return null;
    }
}
exports.JianshuExtractor = JianshuExtractor;

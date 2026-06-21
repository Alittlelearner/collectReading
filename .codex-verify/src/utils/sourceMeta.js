"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceMeta = getSourceMeta;
exports.getSourceLabel = getSourceLabel;
exports.getSourceIcon = getSourceIcon;
const SOURCE_META = {
    bilibili: { label: 'Bilibili', icon: 'television-play' },
    zhihu: { label: '知乎', icon: 'comment-text-outline' },
    wechat: { label: '公众号', icon: 'message-text-outline' },
    ebook: { label: '电子书', icon: 'book-open-page-variant-outline' },
    website: { label: '网站', icon: 'web' },
    metasearch: { label: '聚合', icon: 'layers-triple-outline' },
    jike: { label: '即刻', icon: 'chat-processing-outline' },
    xueqiu: { label: '雪球', icon: 'finance' },
    other: { label: '其他', icon: 'bookmark-outline' },
};
function getSourceMeta(type) {
    return SOURCE_META[type] || SOURCE_META.other;
}
function getSourceLabel(type) {
    return getSourceMeta(type).label;
}
function getSourceIcon(type) {
    return getSourceMeta(type).icon;
}

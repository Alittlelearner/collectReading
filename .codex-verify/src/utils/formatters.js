"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRelativeDate = formatRelativeDate;
exports.formatDateTime = formatDateTime;
exports.formatShortDate = formatShortDate;
exports.formatRelativeTime = formatRelativeTime;
function formatRelativeDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.floor((today - target) / 86400000);
    if (diffDays <= 0)
        return '今天';
    if (diffDays === 1)
        return '昨天';
    if (diffDays < 7)
        return `${diffDays} 天前`;
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}
function formatDateTime(timestamp) {
    if (!timestamp)
        return '未记录';
    return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatShortDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}
function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours <= 0)
        return '刚刚';
    if (hours < 24)
        return `${hours} 小时前`;
    if (days < 7)
        return `${days} 天前`;
    return formatShortDate(timestamp);
}

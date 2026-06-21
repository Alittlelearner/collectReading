"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImageUrl = normalizeImageUrl;
const react_native_1 = require("react-native");
const HOTLINK_BLOCKED_HOSTS = ['hdslb.com'];
function needsWebProxy(url) {
    if (react_native_1.Platform.OS !== 'web') {
        return false;
    }
    return HOTLINK_BLOCKED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}
function toWebProxyUrl(url) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}
function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    const trimmed = url.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }
    if (trimmed.startsWith('http://')) {
        url = `https://${trimmed.slice('http://'.length)}`;
    }
    else if (trimmed.startsWith('//')) {
        url = `https:${trimmed}`;
    }
    else {
        url = trimmed;
    }
    try {
        const parsed = new URL(url);
        if (needsWebProxy(parsed)) {
            return toWebProxyUrl(parsed.toString());
        }
        return parsed.toString();
    }
    catch {
        return url;
    }
}

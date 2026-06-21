"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
exports.fetchJsonWithTimeout = fetchJsonWithTimeout;
exports.fetchTextWithTimeout = fetchTextWithTimeout;
exports.fetchJsonp = fetchJsonp;
const react_native_1 = require("react-native");
let jsonpRequestId = 0;
async function fetchWithTimeout(url, init = {}, timeoutMs = 5000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
        ? setTimeout(() => {
            controller.abort();
        }, timeoutMs)
        : null;
    try {
        return await fetch(url, {
            ...init,
            signal: init.signal ?? controller?.signal,
        });
    }
    finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}
async function fetchJsonWithTimeout(url, init = {}, timeoutMs = 5000) {
    const response = await fetchWithTimeout(url, init, timeoutMs);
    return response.json();
}
async function fetchTextWithTimeout(url, init = {}, timeoutMs = 5000) {
    const response = await fetchWithTimeout(url, init, timeoutMs);
    return response.text();
}
async function fetchJsonp(url, options = {}) {
    if (react_native_1.Platform.OS !== 'web' || typeof document === 'undefined') {
        throw new Error('JSONP_ONLY_SUPPORTED_ON_WEB');
    }
    const callbackParam = options.callbackParam || 'callback';
    const timeoutMs = options.timeoutMs || 5000;
    const callbackName = `__collect_reading_jsonp_${Date.now()}_${jsonpRequestId++}`;
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}jsonp=jsonp&${callbackParam}=${encodeURIComponent(callbackName)}`;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const globalObject = globalThis;
        let settled = false;
        const cleanup = () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete globalObject[callbackName];
        };
        const timer = setTimeout(() => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(new Error('JSONP_TIMEOUT'));
        }, timeoutMs);
        globalObject[callbackName] = (payload) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            cleanup();
            resolve(payload);
        };
        script.async = true;
        script.src = requestUrl;
        script.onerror = () => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            cleanup();
            reject(new Error('JSONP_REQUEST_FAILED'));
        };
        document.body.appendChild(script);
    });
}

import { Platform } from 'react-native';

let jsonpRequestId = 0;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
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
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchJsonWithTimeout<T = any>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<T> {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  return response.json();
}

export async function fetchTextWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 5000,
): Promise<string> {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  return response.text();
}

export async function fetchJsonp<T = any>(
  url: string,
  options: {
    callbackParam?: string;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('JSONP_ONLY_SUPPORTED_ON_WEB');
  }

  const callbackParam = options.callbackParam || 'callback';
  const timeoutMs = options.timeoutMs || 5000;
  const callbackName = `__collect_reading_jsonp_${Date.now()}_${jsonpRequestId++}`;
  const separator = url.includes('?') ? '&' : '?';
  const requestUrl = `${url}${separator}jsonp=jsonp&${callbackParam}=${encodeURIComponent(
    callbackName,
  )}`;

  return new Promise<T>((resolve, reject) => {
    const script = document.createElement('script');
    const globalObject = globalThis as Record<string, unknown>;
    let settled = false;

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete globalObject[callbackName];
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('JSONP_TIMEOUT'));
    }, timeoutMs);

    globalObject[callbackName] = (payload: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(payload);
    };

    script.async = true;
    script.src = requestUrl;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('JSONP_REQUEST_FAILED'));
    };

    document.body.appendChild(script);
  });
}

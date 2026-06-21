import { Platform } from 'react-native';

const HOTLINK_BLOCKED_HOSTS = ['hdslb.com'];

function needsWebProxy(url: URL): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }

  return HOTLINK_BLOCKED_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}

function toWebProxyUrl(url: string): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
}

export function normalizeImageUrl(url: string | null | undefined): string | null {
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
  } else if (trimmed.startsWith('//')) {
    url = `https:${trimmed}`;
  } else {
    url = trimmed;
  }

  try {
    const parsed = new URL(url);
    if (needsWebProxy(parsed)) {
      return toWebProxyUrl(parsed.toString());
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

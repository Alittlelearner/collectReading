import { normalizeImageUrl } from '../../utils/media';

export interface ArticleMetadata {
  title: string;
  description: string;
  imageUrl: string | null;
  author: string | null;
  originalTags: string[];
  publishedAt: number | null;
}

export function createEmptyArticleMetadata(): ArticleMetadata {
  return {
    title: '',
    description: '',
    imageUrl: null,
    author: null,
    originalTags: [],
    publishedAt: null,
  };
}

export function extractMeta(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

export function extractTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : '';
}

export function extractJsonLdObjects(html: string): any[] {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const results: any[] = [];

  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(decodeHtmlEntities(raw));
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {}
  }

  return results;
}

export function findJsonLdByType(items: any[], types: string[]): any | null {
  const normalizedTypes = new Set(types.map((type) => type.toLowerCase()));
  return (
    items.find((item) => {
      const value = item?.['@type'];
      if (typeof value === 'string') {
        return normalizedTypes.has(value.toLowerCase());
      }
      if (Array.isArray(value)) {
        return value.some((entry) => typeof entry === 'string' && normalizedTypes.has(entry.toLowerCase()));
      }
      return false;
    }) || null
  );
}

export function extractTextFromHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function createArticleMetadataFromGenericHtml(
  html: string,
  options: {
    titleSuffixes?: string[];
    authorSelectors?: RegExp[];
  } = {},
): ArticleMetadata {
  const jsonLdObjects = extractJsonLdObjects(html);
  const articleJsonLd =
    findJsonLdByType(jsonLdObjects, ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'VideoObject']) ||
    jsonLdObjects[0] ||
    null;

  const title =
    extractJsonLdTitle(articleJsonLd) ||
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    extractTitleTag(html);

  const description =
    extractJsonLdDescription(articleJsonLd) ||
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'twitter:description') ||
    extractMeta(html, 'description') ||
    '';

  const imageUrl = normalizeImageUrl(
    extractJsonLdImage(articleJsonLd) || extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image'),
  );

  const author =
    extractJsonLdAuthor(articleJsonLd) ||
    extractMeta(html, 'article:author') ||
    extractMeta(html, 'author') ||
    extractAuthorBySelectors(html, options.authorSelectors || []);

  const publishedAt = parseDateValue(
    extractJsonLdDate(articleJsonLd) ||
      extractMeta(html, 'article:published_time') ||
      extractMeta(html, 'publish_date') ||
      extractMeta(html, 'og:release_date'),
  );

  const originalTags =
    extractJsonLdKeywords(articleJsonLd) || splitKeywords(extractMeta(html, 'keywords') || '');

  return {
    title: stripTitleSuffixes(title, options.titleSuffixes || []),
    description,
    imageUrl,
    author,
    originalTags,
    publishedAt,
  };
}

export function stripTitleSuffixes(title: string, suffixes: string[]): string {
  if (!title) {
    return '';
  }

  let result = title.trim();
  for (const suffix of suffixes) {
    if (suffix && result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length).trim();
    }
  }
  return result;
}

export function splitKeywords(value: string): string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[;,|/]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function parseDateValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return value > 1000000000000 ? value : value * 1000;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const decoded = decodeHtmlEntities(value.trim()).replace(/&#x2B;/gi, '+');
  const parsed = Date.parse(decoded);
  return Number.isNaN(parsed) ? null : parsed;
}

export function extractNextData(html: string): any | null {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function extractInitialState(html: string): any | null {
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})<\/script>/i);
  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x2B;/gi, '+')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function extractJsonLdTitle(articleJsonLd: any): string {
  return (
    (typeof articleJsonLd?.headline === 'string' && articleJsonLd.headline.trim()) ||
    (typeof articleJsonLd?.name === 'string' && articleJsonLd.name.trim()) ||
    (typeof articleJsonLd?.title === 'string' && articleJsonLd.title.trim()) ||
    ''
  );
}

function extractJsonLdDescription(articleJsonLd: any): string {
  return typeof articleJsonLd?.description === 'string' ? articleJsonLd.description.trim() : '';
}

function extractJsonLdImage(articleJsonLd: any): string | null {
  const image = articleJsonLd?.image || articleJsonLd?.thumbnailUrl;
  if (typeof image === 'string' && image.trim()) {
    return image.trim();
  }
  if (Array.isArray(image)) {
    const first = image.find((item) => typeof item === 'string' && item.trim());
    return first || null;
  }
  if (image && typeof image === 'object') {
    if (typeof image.url === 'string' && image.url.trim()) {
      return image.url.trim();
    }
  }
  return null;
}

function extractJsonLdAuthor(articleJsonLd: any): string | null {
  const author = articleJsonLd?.author;
  if (typeof author === 'string' && author.trim()) {
    return author.trim();
  }
  if (Array.isArray(author)) {
    const names = author
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item.name === 'string') return item.name.trim();
        return '';
      })
      .filter(Boolean);
    return names.length > 0 ? names.join(' / ') : null;
  }
  if (author && typeof author.name === 'string' && author.name.trim()) {
    return author.name.trim();
  }
  return null;
}

function extractJsonLdDate(articleJsonLd: any): string {
  return (
    (typeof articleJsonLd?.datePublished === 'string' && articleJsonLd.datePublished.trim()) ||
    (typeof articleJsonLd?.uploadDate === 'string' && articleJsonLd.uploadDate.trim()) ||
    (typeof articleJsonLd?.pubDate === 'string' && articleJsonLd.pubDate.trim()) ||
    (typeof articleJsonLd?.dateCreated === 'string' && articleJsonLd.dateCreated.trim()) ||
    ''
  );
}

function extractJsonLdKeywords(articleJsonLd: any): string[] {
  const keywords = articleJsonLd?.keywords;
  if (Array.isArray(keywords)) {
    return keywords
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof keywords === 'string') {
    return splitKeywords(keywords);
  }
  return [];
}

function extractAuthorBySelectors(html: string, selectors: RegExp[]): string | null {
  for (const selector of selectors) {
    const match = html.match(selector);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  }
  return null;
}

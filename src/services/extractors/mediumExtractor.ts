import { Extractor, ExtractedMetadata, ExtractorContext, SourceType } from './types';
import { fetchTextWithTimeout } from '../network';

interface MediumFeedItem {
  title: string;
  description: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: number | null;
  originalTags: string[];
  url: string;
  guid: string;
}

export class MediumExtractor implements Extractor {
  readonly id = 'medium';
  readonly displayName = 'Medium';
  readonly pattern = /medium\.com\//;
  readonly sourceType: SourceType = 'website';
  readonly needsHTML = true;
  readonly priority = 60;

  async extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata> {
    const sourceDomain = context.sourceDomain;

    const feedMetadata = await this.extractFromFeed(url, sourceDomain);
    if (feedMetadata) {
      return feedMetadata;
    }

    const html = context.html || '';
    return {
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      imageUrl: this.extractImage(html),
      author: this.extractAuthor(html),
      sourceType: 'website',
      sourceDomain,
      originalTags: [],
      publishedAt: null,
    };
  }

  private async extractFromFeed(url: string, sourceDomain: string): Promise<ExtractedMetadata | null> {
    const publication = this.extractPublicationPath(url);
    if (!publication) {
      return null;
    }

    const feedUrl = `https://medium.com/feed/${publication}`;
    try {
      const feedXml = await fetchTextWithTimeout(
        feedUrl,
        {
          headers: {
            Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
            'User-Agent': 'Mozilla/5.0',
          },
        },
        8000,
      );

      const items = this.parseFeedItems(feedXml);
      const matched = items.find((item) => this.matchesMediumUrl(item, url));
      if (!matched) {
        return null;
      }

      return {
        title: matched.title,
        description: matched.description,
        imageUrl: matched.imageUrl,
        author: matched.author,
        sourceType: 'website',
        sourceDomain,
        originalTags: matched.originalTags,
        publishedAt: matched.publishedAt,
      };
    } catch {
      return null;
    }
  }

  private extractPublicationPath(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!/medium\.com$/i.test(parsed.hostname)) {
        return null;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 0) {
        return null;
      }

      const first = segments[0];
      if (first === 'p') {
        return null;
      }

      return first;
    } catch {
      return null;
    }
  }

  private matchesMediumUrl(item: MediumFeedItem, targetUrl: string): boolean {
    const targetId = this.extractStoryId(targetUrl);
    const itemId = this.extractStoryId(item.url) || this.extractStoryId(item.guid);
    return Boolean(targetId && itemId && targetId === itemId);
  }

  private extractStoryId(url: string): string | null {
    const match = url.match(/-([a-f0-9]{12,})/i);
    return match ? match[1].toLowerCase() : null;
  }

  private parseFeedItems(xml: string): MediumFeedItem[] {
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    return itemMatches.map((itemXml) => {
      const description = this.decodeCdata(this.extractXmlValue(itemXml, 'description'));
      const content = this.decodeCdata(this.extractXmlValue(itemXml, 'content:encoded'));
      const link = this.extractXmlValue(itemXml, 'link') || '';
      const guid = this.extractXmlValue(itemXml, 'guid') || '';

      return {
        title: this.decodeCdata(this.extractXmlValue(itemXml, 'title')) || '',
        description: this.extractSnippet(description) || this.extractSnippet(content),
        imageUrl: this.extractImageFromHtml(description) || this.extractImageFromHtml(content),
        author: this.decodeCdata(this.extractXmlValue(itemXml, 'dc:creator')) || null,
        publishedAt: this.parseDate(this.extractXmlValue(itemXml, 'pubDate')),
        originalTags: this.extractCategories(itemXml),
        url: link,
        guid,
      };
    });
  }

  private extractXmlValue(xml: string, tag: string): string | null {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
    return match?.[1]?.trim() || null;
  }

  private decodeCdata(value: string | null): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '')
      .trim();
  }

  private extractSnippet(html: string): string {
    const snippetMatch = html.match(/<p[^>]*class="medium-feed-snippet"[^>]*>([\s\S]*?)<\/p>/i);
    if (snippetMatch?.[1]) {
      return this.stripHtml(snippetMatch[1]);
    }

    return this.stripHtml(html).slice(0, 180).trim();
  }

  private extractImageFromHtml(html: string): string | null {
    const match = html.match(/<img[^>]+src="([^"]+)"/i);
    return match?.[1] || null;
  }

  private extractCategories(xml: string): string[] {
    const matches = [...xml.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/gi)];
    return matches
      .map((match) => match[1]?.trim())
      .filter((value): value is string => Boolean(value));
  }

  private parseDate(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private stripHtml(value: string): string {
    return value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTitle(html: string): string {
    const ogTitle = this.extractMeta(html, 'og:title');
    if (ogTitle) return ogTitle;

    const rhTitle = html.match(/<title[^>]*data-rh="true"[^>]*>([^<]+)<\/title>/i);
    if (rhTitle?.[1]) return rhTitle[1].trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/ - Medium$/, '').trim() : '';
  }

  private extractDescription(html: string): string {
    const ogDesc = this.extractMeta(html, 'og:description');
    if (ogDesc) return ogDesc;

    const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
    return descMatch ? descMatch[1] : '';
  }

  private extractImage(html: string): string | null {
    return this.extractMeta(html, 'og:image') || this.extractMeta(html, 'twitter:image');
  }

  private extractAuthor(html: string): string | null {
    return this.extractMeta(html, 'article:author') || this.extractMeta(html, 'author');
  }

  private extractMeta(html: string, property: string): string | null {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i'),
    );
    return match ? match[1] : null;
  }
}

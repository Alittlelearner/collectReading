/**
 * 短链展开工具
 * 支持常见短链服务：b23.tv, t.cn, url.cn, etc.
 */

const SHORT_URL_SERVICES = {
  'b23.tv': 'bilibili',
  't.cn': 'weibo',
  'url.cn': 'wechat',
  'w.url.cn': 'wechat',
  'mp.weixin.qq.com': 'wechat',
  'juejin.cn': 'juejin',
  'd.douyin.com': 'douyin',
  'xhslink.com': 'xiaohongshu',
  'vdou.bz': 'douban',
};

export async function expandShortUrl(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // 检查是否是已知短链服务
    const isShortUrl = Object.keys(SHORT_URL_SERVICES).some(domain => 
      hostname.includes(domain) || hostname.endsWith(domain)
    );
    
    if (!isShortUrl) {
      return url;
    }

    // 使用 HEAD 请求获取重定向后的 URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    
    return response.url;
  } catch (error) {
    console.log('[URL Expander] Failed to expand:', error);
    return url;
  }
}

export function isShortUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return Object.keys(SHORT_URL_SERVICES).some(domain => 
      hostname.includes(domain) || hostname.endsWith(domain)
    );
  } catch {
    return false;
  }
}

export function getSourceFromShortUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    for (const [domain, source] of Object.entries(SHORT_URL_SERVICES)) {
      if (hostname.includes(domain) || hostname.endsWith(domain)) {
        return source;
      }
    }
    return null;
  } catch {
    return null;
  }
}

import { URLParserService } from '../src/services/urlParserService';

const service = new URLParserService();

const urls: Array<[string, string]> = [
  ['CSDN', 'https://blog.csdn.net/qq_45752401/article/details/160397685'],
  ['36kr', 'https://m.36kr.com/p/3468806427170432'],
  ['虎嗅', 'https://www.huxiu.com/article/4260829.html'],
  ['简书', 'https://www.jianshu.com/p/d51b95c602bf'],
  ['博客园', 'https://www.cnblogs.com/tangjy/p/17827620.html'],
  ['SegmentFault', 'https://segmentfault.com/a/1190000045064123'],
  ['InfoQ', 'https://www.infoq.cn/article/fy7SPlBrTZQHB7f0JXhm'],
  ['人人都是产品经理', 'https://www.woshipm.com/zhichang/46095.html'],
  ['阮一峰', 'https://www.ruanyifeng.com/blog/2026/05/weekly-issue-398.html'],
  ['Telegram', 'https://t.me/militarymediacenter/2469'],
  ['YouTube', 'https://www.youtube.com/watch?v=pQB2mvUvROw'],
  ['X', 'https://x.com/downdetector/status/2020672753745961038'],
];

async function main() {
  for (const [name, url] of urls) {
    try {
      const result = await service.parse(url);
      console.log(`\n### ${name}`);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`\n### ${name} ERROR`);
      console.log(error instanceof Error ? error.stack : String(error));
    }
  }
}

main();

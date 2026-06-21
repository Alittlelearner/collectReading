import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SourceType } from '../types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type SourceMeta = {
  label: string;
  icon: IconName;
};

const SOURCE_META: Record<SourceType, SourceMeta> = {
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

export function getSourceMeta(type: SourceType): SourceMeta {
  return SOURCE_META[type] || SOURCE_META.other;
}

export function getSourceLabel(type: SourceType): string {
  return getSourceMeta(type).label;
}

export function getSourceIcon(type: SourceType): IconName {
  return getSourceMeta(type).icon;
}

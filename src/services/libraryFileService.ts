import * as FileSystem from 'expo-file-system/legacy';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Platform } from 'react-native';

const ROOT_DIR_NAME = 'collection_read_library';

type WebDirectoryHandleLike = {
  name: string;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WebDirectoryHandleLike>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

let webLibraryRootHandle: WebDirectoryHandleLike | null = null;

export type StoredPickedFile = {
  fileName: string;
  fileExt: string;
  filePath: string;
  fileSize: number;
};

function getDocumentRoot(): string {
  if (Platform.OS === 'web') {
    return `${ROOT_DIR_NAME}/`;
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('FILE_SYSTEM_UNAVAILABLE');
  }
  return `${FileSystem.documentDirectory}${ROOT_DIR_NAME}/`;
}

function sanitizeSegment(value: string): string {
  return (
    value
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 90) || 'untitled'
  );
}

function stripDataUrl(value: string): string {
  const commaIndex = value.indexOf(',');
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}

async function blobFromAsset(asset: DocumentPickerAsset): Promise<Blob> {
  if (asset.file) {
    return asset.file;
  }

  if (asset.base64) {
    const response = await fetch(asset.base64);
    return response.blob();
  }

  const response = await fetch(asset.uri);
  return response.blob();
}

async function getWebDirectoryForPath(path: string): Promise<WebDirectoryHandleLike> {
  if (!webLibraryRootHandle) {
    throw new Error('WEB_LIBRARY_DIRECTORY_REQUIRED');
  }

  const directoryParts = path.split('/').filter(Boolean);
  let current = webLibraryRootHandle;

  for (const part of directoryParts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }

  return current;
}

async function writeWebPickedFile(
  asset: DocumentPickerAsset,
  directory: string,
  fileName: string,
): Promise<void> {
  const targetDirectory = await getWebDirectoryForPath(directory);
  const fileHandle = await targetDirectory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(await blobFromAsset(asset));
  await writable.close();
}

export function isWebDirectoryPickerAvailable(): boolean {
  return Platform.OS === 'web' && typeof (globalThis as any).showDirectoryPicker === 'function';
}

export function hasWebLibraryRootDirectory(): boolean {
  return Boolean(webLibraryRootHandle);
}

export function getWebLibraryRootDirectoryName(): string | null {
  return webLibraryRootHandle?.name || null;
}

export async function chooseWebLibraryRootDirectory(): Promise<string> {
  const picker = (globalThis as any).showDirectoryPicker as
    | undefined
    | (() => Promise<WebDirectoryHandleLike>);

  if (!picker) {
    throw new Error('WEB_DIRECTORY_PICKER_UNAVAILABLE');
  }

  webLibraryRootHandle = await picker();
  await getWebDirectoryForPath(ROOT_DIR_NAME);
  return webLibraryRootHandle.name;
}

export function getLibraryRootDir(): string {
  return getDocumentRoot();
}

export function getBooksRootDir(): string {
  return `${getDocumentRoot()}books/`;
}

export function getNotesRootDir(): string {
  return `${getDocumentRoot()}notes/`;
}

export function getFileExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

export function slugifyFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'note'
  );
}

export async function ensureLibraryDirectories(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await FileSystem.makeDirectoryAsync(getLibraryRootDir(), { intermediates: true });
  await FileSystem.makeDirectoryAsync(getBooksRootDir(), { intermediates: true });
  await FileSystem.makeDirectoryAsync(getNotesRootDir(), { intermediates: true });
}

export async function ensureDirectory(path: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

export async function storePickedFile(
  asset: DocumentPickerAsset,
  directory: string,
  fallbackExt = 'bin',
): Promise<StoredPickedFile> {
  await ensureDirectory(directory);

  const ext = getFileExtension(asset.name) || fallbackExt;
  const baseName = sanitizeSegment(asset.name.replace(/\.[^.]+$/, ''));
  let fileName = `${baseName}.${ext}`;
  let filePath = `${directory}${fileName}`;
  let suffix = 1;

  if (Platform.OS === 'web') {
    await writeWebPickedFile(asset, directory, fileName);
    return {
      fileName,
      fileExt: ext,
      filePath: `${getWebLibraryRootDirectoryName()}/${directory}${fileName}`,
      fileSize: asset.size || 0,
    };
  }

  while ((await FileSystem.getInfoAsync(filePath)).exists) {
    fileName = `${baseName}-${suffix}.${ext}`;
    filePath = `${directory}${fileName}`;
    suffix += 1;
  }

  if (asset.base64) {
    await FileSystem.writeAsStringAsync(filePath, stripDataUrl(asset.base64), {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    await FileSystem.copyAsync({ from: asset.uri, to: filePath });
  }

  const info = await FileSystem.getInfoAsync(filePath);
  return {
    fileName,
    fileExt: ext,
    filePath,
    fileSize: info.exists ? info.size : asset.size || 0,
  };
}

export async function writeMarkdownFile(path: string, content: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function readMarkdownFile(path: string): Promise<string> {
  if (Platform.OS === 'web') {
    return '';
  }

  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    return '';
  }
  return FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function deleteDirectory(path: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await FileSystem.deleteAsync(path, { idempotent: true });
}

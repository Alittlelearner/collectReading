import type { AppDatabase } from './database';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const DEFAULT_REMOTE_DB_URL = 'http://127.0.0.1:47631';
const API_TIMEOUT_MS = 2500;

type SqlCommand = 'exec' | 'run' | 'all' | 'first';

type RemoteSqlResponse<T> = {
  ok: boolean;
  result?: T;
  error?: string;
};

const clientId = createClientId();

export function getRemoteDatabaseUrl(): string | null {
  const configured = getEnvValue('EXPO_PUBLIC_COLLECTION_READ_DB_API_URL');
  if (configured === 'off' || configured === 'false' || configured === '0') {
    return null;
  }
  return normalizeUrl(configured || DEFAULT_REMOTE_DB_URL);
}

export async function createRemoteDatabase(
  baseUrl: string,
  onWrite: () => void,
): Promise<AppDatabase> {
  await request<unknown>(baseUrl, '/health', { method: 'GET' });

  return {
    runAsync: async (source: string, ...params: any[]) => {
      const result = await executeSql<any>(baseUrl, 'run', source, params);
      onWrite();
      return result;
    },
    execAsync: async (source: string) => {
      await executeSql<void>(baseUrl, 'exec', source, []);
      onWrite();
    },
    getAllAsync: async <T>(source: string, ...params: any[]) => {
      return await executeSql<T[]>(baseUrl, 'all', source, params);
    },
    getFirstAsync: async <T>(source: string, ...params: any[]) => {
      return await executeSql<T | null>(baseUrl, 'first', source, params);
    },
    closeAsync: async () => {
      await request<unknown>(baseUrl, '/client/close', {
        method: 'POST',
        body: JSON.stringify({ clientId }),
      }).catch(() => undefined);
    },
  } as AppDatabase;
}

async function executeSql<T>(
  baseUrl: string,
  command: SqlCommand,
  source: string,
  params: any[],
): Promise<T> {
  const response = await request<T>(baseUrl, '/sql', {
    method: 'POST',
    body: JSON.stringify({
      clientId,
      command,
      source,
      params: normalizeParams(params),
    }),
  });
  return response;
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = (await response.json()) as RemoteSqlResponse<T>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload.result as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeParams(params: any[]): any[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function getEnvValue(key: string): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env?.[key];
}

function createClientId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `web-${Date.now()}-${random}`;
}

// Personal API keys for outside assistants. The key is made here, shown once,
// and only its SHA-256 hash is stored; the `api` edge function hashes the
// bearer token it receives the same way and looks the hash up.

const PREFIX = 'tm_';

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A new key: `tm_` plus 32 random bytes, base64url. */
export const generateApiKey = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return PREFIX + toBase64Url(bytes);
};

/** Hex SHA-256, matching `sha256Hex` in supabase/functions/api/index.ts. */
export const hashApiKey = async (key: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Enough of the key to tell keys apart in a list, and no more. */
export const apiKeyPrefix = (key: string): string => key.slice(0, PREFIX.length + 6);

/** Base URL of the read-only API. */
export const apiBaseUrl = (): string => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

import { describe, expect, it } from 'vitest';
import { apiKeyPrefix, generateApiKey, hashApiKey } from './apiTokens';

describe('api keys', () => {
  it('generates distinct tm_ keys the edge function will accept', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a).not.toBe(b);
    // The edge function's bearer pattern.
    expect(a).toMatch(/^tm_[A-Za-z0-9_-]+$/);
    expect(a.length).toBe(3 + 43);
  });

  it('hashes to hex SHA-256', async () => {
    expect(await hashApiKey('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('keeps only a short prefix for display', () => {
    expect(apiKeyPrefix('tm_abcdefghijk')).toBe('tm_abcdef');
  });
});

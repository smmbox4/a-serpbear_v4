import { serializeError } from '../../utils/errorSerialization';

describe('serializeError', () => {
  it('prefixes status codes and flattens nested request info', () => {
    const errorObject = {
      status: 400,
      error: 'API rate limit exceeded',
      request_info: {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        },
      },
    };

    const result = serializeError(errorObject);
    expect(result).toContain('[400]');
    expect(result).toContain('API rate limit exceeded');
    expect(result).toContain('Too many requests');
  });

  it('preserves error messages from native Error instances and their causes', () => {
    const rootError = new Error('Network unreachable');
    const wrappedError = new Error('Failed to refresh keyword');
    (wrappedError as Error & { cause?: unknown }).cause = rootError;

    const result = serializeError(wrappedError);
    expect(result).toContain('Failed to refresh keyword');
    expect(result).toContain('Network unreachable');
  });

  it('falls back to JSON for plain objects without readable properties', () => {
    const payload = { meta: { attempt: 1 } };
    const result = serializeError(payload);
    expect(result).toBe(JSON.stringify(payload));
  });

  it('returns a stable fallback for circular structures', () => {
    const circular: any = { prop: 'value' };
    circular.self = circular;
    const result = serializeError(circular);
    expect(result).toBe('Unserializable error object');
  });

  it('returns Unknown error for nullish values and empty strings', () => {
    expect(serializeError(null)).toBe('Unknown error');
    expect(serializeError(undefined)).toBe('Unknown error');
    expect(serializeError('')).toBe('Unknown error');
  });

  it('stringifies primitive values safely', () => {
    expect(serializeError(404)).toBe('404');
    expect(serializeError(true)).toBe('true');
  });

  it('returns the raw string for readable inputs', () => {
    const message = 'Simple error message';
    expect(serializeError(message)).toBe(message);
  });
});

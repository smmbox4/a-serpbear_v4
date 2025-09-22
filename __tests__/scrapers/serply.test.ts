import serply from '../../scrapers/services/serply';

describe('serply scraper', () => {
  const settings = { scraping_api: 'token-123' } as any;

  it('generates a query-string based API URL with search parameters', () => {
    const keyword: Partial<KeywordType> = {
      keyword: 'best coffee beans',
      country: 'US',
      device: 'desktop',
    };

    const url = serply.scrapeURL(keyword, settings, undefined as any);
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://api.serply.io');
    expect(parsed.pathname).toBe('/v1/search');
    expect(parsed.searchParams.get('q')).toBe(keyword.keyword);
    expect(parsed.searchParams.get('num')).toBe('100');
    expect(parsed.searchParams.get('hl')).toBe(keyword.country);
  });

  it('preserves header configuration for device and country handling', () => {
    const mobileKeyword: Partial<KeywordType> = {
      keyword: 'espresso machines',
      country: 'CA',
      device: 'mobile',
    };

    const desktopKeyword: Partial<KeywordType> = {
      keyword: 'espresso machines',
      country: 'ZZ',
      device: 'desktop',
    };

    const mobileHeaders = serply.headers(mobileKeyword, settings);
    const desktopHeaders = serply.headers(desktopKeyword, settings);

    expect(mobileHeaders['X-User-Agent']).toBe('mobile');
    expect(mobileHeaders['X-Proxy-Location']).toBe('CA');
    expect(desktopHeaders['X-User-Agent']).toBe('desktop');
    expect(desktopHeaders['X-Proxy-Location']).toBe('US');
  });
});

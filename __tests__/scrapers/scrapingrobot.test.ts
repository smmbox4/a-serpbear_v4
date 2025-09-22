import scrapingRobot from '../../scrapers/services/scrapingrobot';

describe('scrapingRobot scraper', () => {
  it('includes locale parameters in Google queries', () => {
    const keyword = {
      keyword: 'best coffee beans',
      country: 'US',
      device: 'desktop',
    } as any;
    const settings = { scraping_api: 'token-123' } as any;
    const countryData = {
      US: ['United States', 'Washington, D.C.', 'en', 2840],
    } as any;

    const url = scrapingRobot.scrapeURL(keyword, settings, countryData);

    const googleUrl = new URL('https://www.google.com/search');
    googleUrl.searchParams.set('num', '100');
    googleUrl.searchParams.set('hl', 'en');
    googleUrl.searchParams.set('gl', 'US');
    googleUrl.searchParams.set('q', keyword.keyword);
    const encodedUrl = encodeURIComponent(googleUrl.toString());

    expect(url).toContain(`&url=${encodedUrl}`);
    expect(url).toContain('%26gl%3DUS');
  });
});

import { readFile } from 'fs/promises';
import generateEmail from '../../utils/generateEmail';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockReadFile = readFile as jest.Mock;

const createSettings = (overrides: Record<string, unknown> = {}) => ({
  search_console_client_email: '',
  search_console_private_key: '',
  keywordsColumns: [],
  scraper_type: 'mock-scraper',
  available_scapers: [
    { label: 'Mock Scraper', value: 'mock-scraper', supportsMapPack: true },
  ],
  ...overrides,
}) as any;

describe('generateEmail', () => {
  it('includes location details in keyword table when provided', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}{{keywordsTable}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'test keyword',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 5,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        location: 'Berlin,Berlin State,DE',
        mapPackTop3: true,
      },
    ] as any;

    const settings = createSettings();

    const domain = {
      domain: 'example.com',
      keywordsTracked: 3,
      avgPosition: 2,
      mapPackKeywords: 1,
    } as any;

    const html = await generateEmail(domain, keywords, settings);
    expect(html).toContain('(Berlin, Berlin State)');
    expect(html).toContain('map-pack-flag');
  });

  it('separates icons from keyword text into dedicated column', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}{{keywordsTable}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'very long keyword that might wrap to multiple lines in email',
        device: 'mobile',
        country: 'DE',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 3,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        location: 'Munich,Bavaria,DE',
        mapPackTop3: true,
      },
    ] as any;

    const settings = createSettings();

    const domain = {
      domain: 'example.com',
      keywordsTracked: 8,
      avgPosition: 4,
      mapPackKeywords: 2,
    } as any;

    const html = await generateEmail(domain, keywords, settings);
    
    // Verify icons are in their own column (first <td>)
    expect(html).toMatch(/<td><span class="flag-stack">.*<\/span><\/td>/);
    
    // Verify keyword text is in separate column (second <td>) with device icon
    expect(html).toMatch(/<td><img class="device".*> very long keyword that might wrap to multiple lines in email<\/td>/);
    
    // Verify location is in third column
    expect(html).toContain('<td>(Munich, Bavaria)</td>');
    
    // Verify map pack flag is included in the icon column
    expect(html).toContain('map-pack-flag');
    expect(html).toContain('MP</span>');
    expect(html).toContain('<span class="mini_stats__label">Keywords</span>');
  });

  it('renders domain tracker summary stats', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}{{keywordsTable}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'summary keyword',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 7,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
      },
    ] as any;

    const domain = {
      domain: 'example.com',
      keywordsTracked: 15,
      avgPosition: 5,
      mapPackKeywords: 4,
    } as any;

    const settings = createSettings();

    const html = await generateEmail(domain, keywords, settings);

    expect(html).toContain('<span class="mini_stats__badge">Tracker</span>');
    expect(html).toContain('<span class="mini_stats__title">Summary</span>');
    expect(html).toContain('colspan="3"');
    expect(html).toContain('<span class="mini_stats__label">Keywords</span>');
    expect(html).toContain('<span class="mini_stats__value">15</span>');
    expect(html).toMatch(/<span class="mini_stats__label">Avg position<\/span>\s*<span class="mini_stats__value">5<\/span>/);
    expect(html).toMatch(/<span class="mini_stats__label">Map Pack<\/span>\s*<span class="mini_stats__value">4<\/span>/);
  });

  it('omits the map pack column when the active scraper does not support it', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}{{keywordsTable}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'no map pack keyword',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 10,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
      },
    ] as any;

    const domain = {
      domain: 'example.com',
      keywordsTracked: 9,
      avgPosition: 4,
      mapPackKeywords: 3,
    } as any;

    const settings = createSettings({
      available_scapers: [
        { label: 'Proxy', value: 'mock-scraper', supportsMapPack: false },
      ],
    });

    const html = await generateEmail(domain, keywords, settings);

    expect(html).toContain('colspan="2"');
    expect(html).not.toContain('Map Pack');
  });

  it('calculates tracker summary stats from keywords when domain stats are missing', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'fallback keyword 1',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 3,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        mapPackTop3: true,
      },
      {
        ID: 2,
        keyword: 'fallback keyword 2',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 4,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        mapPackTop3: false,
      },
    ] as any;

    const domain = {
      domain: 'example.com',
    } as any;

    const settings = createSettings();

    const html = await generateEmail(domain, keywords, settings);

    expect(html).toMatch(/<span class="mini_stats__label">Keywords<\/span>\s*<span class="mini_stats__value">2<\/span>/);
    expect(html).toMatch(/<span class="mini_stats__label">Avg position<\/span>\s*<span class="mini_stats__value">3.5<\/span>/);
    expect(html).toMatch(/<span class="mini_stats__label">Map Pack<\/span>\s*<span class="mini_stats__value">1<\/span>/);
  });

  it('calculates tracker summary stats correctly excluding position 0 keywords when domain stats are missing', async () => {
    mockReadFile.mockResolvedValue('<html>{{domainStats}}</html>');

    const keywords = [
      {
        ID: 1,
        keyword: 'ranked keyword 1',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 5,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        mapPackTop3: true,
      },
      {
        ID: 2,
        keyword: 'not ranked keyword',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 0, // Not ranked
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        mapPackTop3: false,
      },
      {
        ID: 3,
        keyword: 'ranked keyword 2',
        device: 'desktop',
        country: 'US',
        domain: 'example.com',
        lastUpdated: new Date().toISOString(),
        added: new Date().toISOString(),
        position: 10,
        volume: 0,
        sticky: false,
        history: {},
        lastResult: [],
        url: '',
        tags: [],
        updating: false,
        lastUpdateError: false,
        mapPackTop3: true,
      },
    ] as any;

    const domain = {
      domain: 'example.com',
    } as any;

    const settings = createSettings();

    const html = await generateEmail(domain, keywords, settings);

    expect(html).toMatch(/<span class="mini_stats__label">Keywords<\/span>\s*<span class="mini_stats__value">3<\/span>/);
    // Should only average the ranked keywords: (5+10)/2 = 7.5
    expect(html).toMatch(/<span class="mini_stats__label">Avg position<\/span>\s*<span class="mini_stats__value">7.5<\/span>/);
    expect(html).toMatch(/<span class="mini_stats__label">Map Pack<\/span>\s*<span class="mini_stats__value">2<\/span>/);
  });
});

import getdomainStats from '../../utils/domains';
import Keyword from '../../database/models/keyword';
import parseKeywords from '../../utils/parseKeywords';
import { readLocalSCData } from '../../utils/searchConsole';

jest.mock('../../database/models/keyword', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));

jest.mock('../../utils/parseKeywords', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('../../utils/searchConsole', () => ({
  __esModule: true,
  readLocalSCData: jest.fn(),
}));

const mockFindAll = (Keyword as any).findAll as jest.Mock;
const mockParseKeywords = parseKeywords as jest.Mock;
const mockReadLocalSCData = readLocalSCData as jest.Mock;

describe('getdomainStats', () => {
  it('returns avgPosition 0 when domain has no keywords', async () => {
    mockFindAll.mockResolvedValue([]);
    mockParseKeywords.mockReturnValue([]);
    mockReadLocalSCData.mockResolvedValue(null);

    const domain = {
      ID: 1,
      domain: 'example.com',
      slug: 'example-com',
      notification: false,
      notification_interval: '',
      notification_emails: '',
      lastUpdated: new Date().toISOString(),
      added: new Date().toISOString(),
    } as any;

    const result = await getdomainStats([domain]);
    expect(result[0].avgPosition).toBe(0);
    expect(result[0].keywordsTracked).toBe(0);
    expect(result[0].mapPackKeywords).toBe(0);
  });

  it('calculates stats correctly with multiple keywords', async () => {
    const mockKeywordData = [
      { get: () => ({ ID: 1, position: 5, lastUpdated: '2023-01-01', mapPackTop3: true }) },
      { get: () => ({ ID: 2, position: 15, lastUpdated: '2023-01-02', mapPackTop3: false }) },
      { get: () => ({ ID: 3, position: 10, lastUpdated: '2023-01-03', mapPackTop3: true }) },
    ];

    const parsedKeywords = [
      { ID: 1, position: 5, lastUpdated: '2023-01-01', mapPackTop3: true },
      { ID: 2, position: 15, lastUpdated: '2023-01-02', mapPackTop3: false },
      { ID: 3, position: 10, lastUpdated: '2023-01-03', mapPackTop3: true },
    ];

    mockFindAll.mockResolvedValue(mockKeywordData);
    mockParseKeywords.mockReturnValue(parsedKeywords);
    mockReadLocalSCData.mockResolvedValue(null);

    const domain = {
      ID: 1,
      domain: 'example.com',
      slug: 'example-com',
      notification: false,
      notification_interval: '',
      notification_emails: '',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
    } as any;

    const result = await getdomainStats([domain]);
    
    expect(result[0].keywordsTracked).toBe(3);
    expect(result[0].mapPackKeywords).toBe(2); // two keywords have mapPackTop3 = true
    expect(result[0].avgPosition).toBe(10); // Math.round((5+15+10)/3) = Math.round(30/3) = 10
  });

  it('handles edge case with all keywords having mapPackTop3 false', async () => {
    const parsedKeywords = [
      { ID: 1, position: 1, lastUpdated: '2023-01-01', mapPackTop3: false },
      { ID: 2, position: 2, lastUpdated: '2023-01-02', mapPackTop3: false },
    ];

    mockFindAll.mockResolvedValue([]);
    mockParseKeywords.mockReturnValue(parsedKeywords);
    mockReadLocalSCData.mockResolvedValue(null);

    const domain = { 
      ID: 1, 
      domain: 'test.com', 
      slug: 'test-com', 
      notification: false,
      notification_interval: '',
      notification_emails: '',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
    } as any;

    const result = await getdomainStats([domain]);
    
    expect(result[0].keywordsTracked).toBe(2);
    expect(result[0].mapPackKeywords).toBe(0); // no keywords with mapPackTop3 = true
    expect(result[0].avgPosition).toBe(2); // Math.round((1+2)/2) = Math.round(1.5) = 2
  });

  it('excludes position 0 keywords from average position calculation', async () => {
    const parsedKeywords = [
      { ID: 1, position: 5, lastUpdated: '2023-01-01', mapPackTop3: true },
      { ID: 2, position: 0, lastUpdated: '2023-01-02', mapPackTop3: false }, // unranked
      { ID: 3, position: 15, lastUpdated: '2023-01-03', mapPackTop3: false },
      { ID: 4, position: 0, lastUpdated: '2023-01-04', mapPackTop3: false }, // unranked
    ];

    mockFindAll.mockResolvedValue([]);
    mockParseKeywords.mockReturnValue(parsedKeywords);
    mockReadLocalSCData.mockResolvedValue(null);

    const domain = { 
      ID: 1, 
      domain: 'test-position0.com', 
      slug: 'test-position0-com', 
      notification: false,
      notification_interval: '',
      notification_emails: '',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      added: '2023-01-01T00:00:00.000Z',
    } as any;

    const result = await getdomainStats([domain]);
    
    expect(result[0].keywordsTracked).toBe(4); // total keywords including unranked
    expect(result[0].mapPackKeywords).toBe(1); // only one keyword has mapPackTop3 = true
    // Average should only include ranked keywords: (5+15)/2 = 10
    expect(result[0].avgPosition).toBe(10);
  });
});

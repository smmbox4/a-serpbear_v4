import { fetchKeywords } from '../../services/keywords';

describe('fetchKeywords normalisation', () => {
   const originalFetch = global.fetch;
   const originalLocation = window.location;

   const mockOrigin = 'http://localhost:3000';
   const fetchMock = jest.fn();

   beforeAll(() => {
      Object.defineProperty(window, 'location', {
         value: { origin: mockOrigin },
         writable: true,
      });
      global.fetch = fetchMock as unknown as typeof global.fetch;
   });

   afterAll(() => {
      Object.defineProperty(window, 'location', {
         value: originalLocation,
         writable: true,
      });
      global.fetch = originalFetch;
   });

   beforeEach(() => {
      fetchMock.mockReset();
   });

   it('coerces string and numeric flags into booleans', async () => {
      const keywordPayload = {
         ID: 1,
         keyword: 'normalise flags',
         device: 'desktop',
         country: 'US',
         domain: 'example.com',
         lastUpdated: '2024-01-01T00:00:00.000Z',
         added: '2024-01-01T00:00:00.000Z',
         position: 12,
         volume: 50,
         sticky: '0',
         history: { '2024-01-01': 12 },
         lastResult: [],
         url: '',
         tags: [],
         updating: 'false',
         lastUpdateError: false,
         mapPackTop3: 'yes',
      } as unknown as KeywordType;

      fetchMock.mockResolvedValue({
         json: jest.fn().mockResolvedValue({ keywords: [keywordPayload] }),
      });

      const response = await fetchKeywords({} as any, 'example.com');

      expect(fetchMock).toHaveBeenCalledWith(
         `${mockOrigin}/api/keywords?domain=example.com`,
         { method: 'GET' },
      );

      expect(response).toBeTruthy();
      expect(Array.isArray(response.keywords)).toBe(true);

      const [keyword] = response.keywords as KeywordType[];
      expect(keyword.updating).toBe(false);
      expect(typeof keyword.updating).toBe('boolean');
      expect(keyword.sticky).toBe(false);
      expect(keyword.mapPackTop3).toBe(true);
   });

   it('returns consistent object shape when domain is falsy', async () => {
      // Test with empty string
      const response1 = await fetchKeywords({} as any, '');
      expect(response1).toBeTruthy();
      expect(typeof response1).toBe('object');
      expect('keywords' in response1).toBe(true);
      expect(Array.isArray(response1.keywords)).toBe(true);
      expect(response1.keywords).toHaveLength(0);

      // Test with null
      const response2 = await fetchKeywords({} as any, null as any);
      expect(response2).toBeTruthy();
      expect(typeof response2).toBe('object');
      expect('keywords' in response2).toBe(true);
      expect(Array.isArray(response2.keywords)).toBe(true);
      expect(response2.keywords).toHaveLength(0);

      // Test with undefined
      const response3 = await fetchKeywords({} as any, undefined as any);
      expect(response3).toBeTruthy();
      expect(typeof response3).toBe('object');
      expect('keywords' in response3).toBe(true);
      expect(Array.isArray(response3.keywords)).toBe(true);
      expect(response3.keywords).toHaveLength(0);
   });
});

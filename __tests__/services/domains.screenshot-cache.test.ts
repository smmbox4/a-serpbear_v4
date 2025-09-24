type FetchDomainScreenshot = (domain: string, forceFetch?: boolean) => Promise<string | false>;

describe('fetchDomainScreenshot cache resilience', () => {
   const originalFetch = global.fetch;

   beforeEach(() => {
      jest.resetModules();
      localStorage.clear();
      if (!originalFetch) {
         (global as typeof globalThis & { fetch: jest.Mock }).fetch = jest.fn();
      }
   });

   afterEach(() => {
      if (!originalFetch) {
         delete (global as typeof globalThis & { fetch?: jest.Mock }).fetch;
      }
   });

   it.each([
      ['invalid JSON string', 'not-json'],
      ['a JSON array', '[]'],
      ['a JSON primitive', 'true'],
      ['an object with non-string values', '{"domain":123}'],
   ])('clears invalid cached thumbnails (%s) before fetching', async (_name, invalidCache) => {
      localStorage.setItem('domainThumbs', invalidCache);

      let fetchDomainScreenshot: FetchDomainScreenshot | undefined;
      jest.isolateModules(() => {
         const mod = require('../../services/domains');
         fetchDomainScreenshot = mod.fetchDomainScreenshot;
      });

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
         status: 500,
         blob: jest.fn(),
      } as unknown as Response);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await (fetchDomainScreenshot as FetchDomainScreenshot)('example.com');

      expect(result).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('domainThumbs')).toBeNull();

      fetchSpy.mockRestore();
      warnSpy.mockRestore();
   });
});

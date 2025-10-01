import { resolveCountryCode } from '../../utils/scraperHelpers';

describe('resolveCountryCode', () => {
   it('preserves casing for valid country codes', () => {
      expect(resolveCountryCode('us')).toBe('us');
      expect(resolveCountryCode('US')).toBe('US');
      expect(resolveCountryCode('Ca')).toBe('Ca');
   });

   it('falls back to default for unsupported codes without allowed list', () => {
      expect(resolveCountryCode('ZZ')).toBe('US');
   });

   it('uses provided fallback when valid', () => {
      expect(resolveCountryCode('zz', undefined, 'gb')).toBe('GB');
   });

   it('prefers fallback when allowed countries provided and contains fallback', () => {
      expect(resolveCountryCode('zz', ['US', 'CA'], 'us')).toBe('US');
   });

   it('falls back to first valid allowed country when fallback is not permitted', () => {
      expect(resolveCountryCode('zz', ['DE', 'FR'], 'BR')).toBe('DE');
   });
});

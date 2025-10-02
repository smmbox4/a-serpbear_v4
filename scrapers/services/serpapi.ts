import countries from '../../utils/countries';
import { resolveCountryCode } from '../../utils/scraperHelpers';
import { parseLocation } from '../../utils/location';
import { computeMapPackTop3 } from '../../utils/mapPack';
import { getGoogleDomain } from '../../utils/googleDomains';

interface SerpApiResult {
   title: string,
   link: string,
   position: number,
}

const serpapi:ScraperSettings = {
   id: 'serpapi',
   name: 'SerpApi.com',
   website: 'serpapi.com',
   allowsCity: true,
   supportsMapPack: true,
   headers: (keyword: KeywordType, settings: SettingsType) => ({
         'Content-Type': 'application/json',
         'X-API-Key': settings.scraping_api,
      }),
   scrapeURL: (keyword, settings) => {
      const country = resolveCountryCode(keyword.country);
      const countryInfo = countries[country] ?? countries.US;
      const countryName = countryInfo?.[0] ?? countries.US[0];
      const { city, state } = parseLocation(keyword.location, keyword.country);
      const plusEncode = (str: string) => str.replace(/ /g, '+');
      const locationParts = [city, state, countryName].filter(Boolean).map(plusEncode);
      const googleDomain = getGoogleDomain(country);
      const params = new URLSearchParams();
      params.set('engine', 'google');
      params.set('q', plusEncode(keyword.keyword));
      if ((city || state) && locationParts.length) {
         params.set('location', locationParts.join(','));
      }
      params.set('google_domain', googleDomain);
      params.set('gl', country);
      params.set('hl', countryInfo?.[2] ?? 'en');
      params.set('api_key', settings.scraping_api);
      return `https://serpapi.com/search.json?${params.toString()}`;
   },
   resultObjectKey: 'organic_results',
   serpExtractor: ({ result, response, keyword }) => {
      const extractedResult = [];
      let results: SerpApiResult[] = [];

      if (typeof result === 'string') {
         try {
            results = JSON.parse(result) as SerpApiResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for SerpApi.com: ${error instanceof Error ? error.message : error}`);
         }
      } else if (Array.isArray(result)) {
         results = result as SerpApiResult[];
      } else if (Array.isArray(response?.organic_results)) {
         results = response.organic_results as SerpApiResult[];
      }

      for (const { link, title, position } of results) {
         if (title && link) {
            extractedResult.push({
               title,
               url: link,
               position,
            });
         }
      }

      const mapPackTop3 = computeMapPackTop3(keyword.domain, response);

      return { organic: extractedResult, mapPackTop3 };
   },
};

export default serpapi;

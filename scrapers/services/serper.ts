import { resolveCountryCode } from '../../utils/scraperHelpers';
import { parseLocation } from '../../utils/location';
import { computeMapPackTop3 } from '../../utils/mapPack';

interface SerperResult {
   title: string,
   link: string,
   position: number,
}

const serper:ScraperSettings = {
   id: 'serper',
   name: 'Serper.dev',
   website: 'serper.dev',
   allowsCity: true,
   scrapeURL: (keyword, settings, countryData) => {
      const countryCode = resolveCountryCode(keyword.country);
      const normalizedCountry = countryCode.toUpperCase();
      const gl = countryCode || normalizedCountry;
      const fallbackInfo = countryData[normalizedCountry]
         ?? countryData.US
         ?? Object.values(countryData)[0];
      const lang = fallbackInfo?.[2] ?? 'en';
      const countryName = fallbackInfo?.[0];
      const { city, state } = parseLocation(keyword.location, keyword.country);
      const hasCityOrState = Boolean(city || state);
      const location = hasCityOrState && countryName
         ? `&location=${encodeURIComponent([city, state, countryName].filter(Boolean).join(','))}`
         : '';

      return `https://google.serper.dev/search?q=${encodeURIComponent(keyword.keyword)}&gl=${gl}&hl=${lang}&num=100${location}&apiKey=${settings.scraping_api}`;
   },
   resultObjectKey: 'organic',
   supportsMapPack: true,
   serpExtractor: ({ result, response, keyword }) => {
      const extractedResult = [];
      let results: SerperResult[] = [];
      if (typeof result === 'string') {
         try {
            results = JSON.parse(result) as SerperResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for Serper.dev: ${error instanceof Error ? error.message : error}`);
         }
      } else if (Array.isArray(result)) {
         results = result as SerperResult[];
      } else if (Array.isArray(response?.organic)) {
         results = response.organic as SerperResult[];
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

export default serper;

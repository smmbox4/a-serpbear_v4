import countries from '../../utils/countries';
import { resolveCountryCode } from '../../utils/scraperHelpers';
import { parseLocation } from '../../utils/location';

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
   headers: (keyword: KeywordType, settings: SettingsType) => {
      return {
         'Content-Type': 'application/json',
         'X-API-Key': settings.scraping_api,
      };
   },
   scrapeURL: (keyword, settings) => {
      const country = resolveCountryCode(keyword.country);
      const countryName = countries[country][0];
      const { city, state } = parseLocation(keyword.location, keyword.country);
      const locationParts = [city, state, countryName].filter(Boolean);
      const location = city || state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
      return `https://serpapi.com/search?q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country}&device=${keyword.device}${location}&api_key=${settings.scraping_api}`;
   },
   resultObjectKey: 'organic_results',
   serpExtractor: (content) => {
      const extractedResult = [];
      let results: SerpApiResult[];
      if (typeof content === 'string') {
         try {
            results = JSON.parse(content) as SerpApiResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for SerpApi.com: ${error instanceof Error ? error.message : error}`);
         }
      } else {
         results = content as SerpApiResult[];
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
      return extractedResult;
   },
};

export default serpapi;

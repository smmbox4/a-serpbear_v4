import countries from '../../utils/countries';
import { resolveCountryCode } from '../../utils/scraperHelpers';
import { parseLocation } from '../../utils/location';

interface HasDataResult {
   title: string,
   link: string,
   position: number,
}

const hasdata:ScraperSettings = {
   id: 'hasdata',
   name: 'HasData',
   website: 'hasdata.com',
   allowsCity: true,
   headers: (keyword: KeywordType, settings: SettingsType) => ({
         'Content-Type': 'application/json',
         'x-api-key': settings.scraping_api,
      }),
   scrapeURL: (keyword, settings) => {
      const country = resolveCountryCode(keyword.country);
      const countryName = countries[country][0];
      const { city, state } = parseLocation(keyword.location, keyword.country);
      const locationParts = [city, state, countryName].filter(Boolean);
      const location = city || state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
      return `https://api.scrape-it.cloud/scrape/google/serp?q=${encodeURIComponent(keyword.keyword)}${location}&num=100&gl=${country.toLowerCase()}&deviceType=${keyword.device}`;
   },
   resultObjectKey: 'organicResults',
   serpExtractor: (content) => {
      const extractedResult = [];
      let results: HasDataResult[];
      if (typeof content === 'string') {
         try {
            results = JSON.parse(content) as HasDataResult[];
         } catch (error) {
            throw new Error(`Invalid JSON response for HasData: ${error instanceof Error ? error.message : error}`);
         }
      } else {
         results = content as HasDataResult[];
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

export default hasdata;

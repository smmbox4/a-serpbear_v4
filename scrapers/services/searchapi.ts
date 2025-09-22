import countries from '../../utils/countries';
import { resolveCountryCode } from '../../utils/scraperHelpers';
import { parseLocation } from '../../utils/location';

interface SearchApiResult {
   title: string,
   link: string,
   position: number,
 }

const searchapi:ScraperSettings = {
  id: 'searchapi',
  name: 'SearchApi.io',
  website: 'searchapi.io',
  allowsCity: true,
  headers: (keyword: KeywordType, settings: SettingsType) => {
     return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.scraping_api}`,
     };
  },
  scrapeURL: (keyword) => {
   const country = resolveCountryCode(keyword.country);
   const countryName = countries[country][0];
   const { city, state } = parseLocation(keyword.location, keyword.country);
   const locationParts = [city, state, countryName].filter(Boolean);
   const location = city || state ? `&location=${encodeURIComponent(locationParts.join(','))}` : '';
     return `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(keyword.keyword)}&num=100&gl=${country}&device=${keyword.device}${location}`;
  },
  resultObjectKey: 'organic_results',
  serpExtractor: (content) => {
     const extractedResult = [];
     let results: SearchApiResult[];
     if (typeof content === 'string') {
        try {
           results = JSON.parse(content) as SearchApiResult[];
        } catch (error) {
           throw new Error(`Invalid JSON response for SearchApi.io: ${error instanceof Error ? error.message : error}`);
        }
     } else {
        results = content as SearchApiResult[];
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

export default searchapi;

import Keyword from '../database/models/keyword';

export const normaliseHistory = (rawHistory: unknown): KeywordHistory => {
   if (!rawHistory || typeof rawHistory !== 'object' || Array.isArray(rawHistory)) {
      return {};
   }

   return Object.entries(rawHistory as Record<string, unknown>).reduce<KeywordHistory>((acc, [key, value]) => {
      if (!key) { return acc; }

      const numericValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isNaN(numericValue)) {
         acc[key] = numericValue;
      }
      return acc;
   }, {});
};

/**
 * Parses the SQL Keyword Model object to frontend cosumable object.
 * @param {Keyword[]} allKeywords - Keywords to scrape
 * @returns {KeywordType[]}
 */
const parseKeywords = (allKeywords: Keyword[]) : KeywordType[] => {
   const parsedItems = allKeywords.map((keywrd:Keyword) => {
      let historyRaw: unknown;
      try { historyRaw = JSON.parse(keywrd.history); } catch { historyRaw = {}; }
      const history = normaliseHistory(historyRaw);

      let tags: string[] = [];
      try { tags = JSON.parse(keywrd.tags); } catch { tags = []; }

      let lastResult: any[] = [];
      try { lastResult = JSON.parse(keywrd.lastResult); } catch { lastResult = []; }

      let lastUpdateError: any = false;
      if (keywrd.lastUpdateError !== 'false' && keywrd.lastUpdateError.includes('{')) {
         try { lastUpdateError = JSON.parse(keywrd.lastUpdateError); } catch { lastUpdateError = {}; }
      }

      return {
         ...keywrd,
         location: typeof (keywrd as any).location === 'string' ? (keywrd as any).location : '',
         history,
         tags,
         lastResult,
         lastUpdateError,
      };
   });
   return parsedItems;
};

export default parseKeywords;

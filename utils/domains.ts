import Keyword from '../database/models/keyword';
import parseKeywords from './parseKeywords';
import { readLocalSCData } from './searchConsole';

/**
 * The function `getdomainStats` takes an array of domain objects, retrieves keyword and stats data for
 * each domain, and calculates various statistics for each domain.
 * @param {DomainType[]} domains - An array of objects of type DomainType.
 * @returns {DomainType[]} - An array of objects of type DomainType.
 */
const getdomainStats = async (domains:DomainType[]): Promise<DomainType[]> => {
   const finalDomains: DomainType[] = [];

   for (const domain of domains) {
      const domainWithStat = domain;

      // First Get ALl The Keywords for this Domain
      const allKeywords:Keyword[] = await Keyword.findAll({ where: { domain: domain.domain } });
      const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      domainWithStat.keywordsTracked = keywords.length;
      
      // Use persisted avgPosition and mapPackKeywords from database if available
      // Fall back to calculation if not set or if avgPosition is 0 (likely uninitialized)
      if (typeof domain.avgPosition === 'number' && domain.avgPosition > 0) {
         domainWithStat.avgPosition = domain.avgPosition;
      } else {
         // Fallback calculation
         const { keywordPositions, positionCount } = keywords.reduce(
           (stats, keyword) => {
             if (typeof keyword.position === 'number' && Number.isFinite(keyword.position) && keyword.position > 0) {
               stats.keywordPositions += keyword.position;
               stats.positionCount++;
             }
             return stats;
           },
           { keywordPositions: 0, positionCount: 0 },
         );
         domainWithStat.avgPosition = positionCount > 0 ? Math.round(keywordPositions / positionCount) : 0;
      }
      
      if (typeof domain.mapPackKeywords === 'number' && domain.mapPackKeywords > 0) {
         domainWithStat.mapPackKeywords = domain.mapPackKeywords;
      } else {
         // Fallback calculation
         domainWithStat.mapPackKeywords = keywords.filter(keyword => keyword.mapPackTop3 === true).length;
      }

      // Get the last updated time from keywords
      const KeywordsUpdateDates = keywords.map(keyword => new Date(keyword.lastUpdated).getTime());
      const lastKeywordUpdateDate = Math.max(...KeywordsUpdateDates, 0);
      domainWithStat.keywordsUpdated = new Date(lastKeywordUpdateDate || new Date(domain.lastUpdated).getTime()).toJSON();

      // Then Load the SC File and read the stats and calculate the Last 7 days stats
      const localSCData = await readLocalSCData(domain.domain);
      const days = 7;
      if (localSCData && localSCData.stats && Array.isArray(localSCData.stats) && localSCData.stats.length > 0) {
         const lastSevenStats = localSCData.stats.slice(-days);
         if (lastSevenStats.length > 0) {
            const totalStats = lastSevenStats.reduce((acc, item) => ({
               impressions: item.impressions + acc.impressions,
               clicks: item.clicks + acc.clicks,
               ctr: item.ctr + acc.ctr,
               position: item.position + acc.position,
            }), { impressions: 0, clicks: 0, ctr: 0, position: 0 });
            domainWithStat.scVisits = totalStats.clicks;
            domainWithStat.scImpressions = totalStats.impressions;
            domainWithStat.scPosition = lastSevenStats.length > 0 ? Math.round(totalStats.position / lastSevenStats.length) : 0;
         }
      }

      finalDomains.push(domainWithStat);
   }

   return finalDomains;
};

export default getdomainStats;

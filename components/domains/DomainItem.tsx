/* eslint-disable @next/next/no-img-element */
// import { useRouter } from 'next/router';
// import { useState } from 'react';
import TimeAgo from 'react-timeago';
import dayjs from 'dayjs';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Icon from '../common/Icon';
import ToggleField from '../common/ToggleField';
import { useUpdateDomainToggles } from '../../services/domains';

type DomainItemProps = {
   domain: DomainType,
   selected: boolean,
   isConsoleIntegrated: boolean,
   thumb: string,
   updateThumb: Function,
   screenshotsEnabled?: boolean,
}

const DomainItem = ({
   domain,
   selected,
   isConsoleIntegrated = false,
   thumb,
   updateThumb,
   screenshotsEnabled = true,
}: DomainItemProps) => {
   const { keywordsUpdated, slug, keywordCount = 0, avgPosition = 0, scVisits = 0, scImpressions = 0, scPosition = 0 } = domain;
   const { mutateAsync: updateDomainToggle, isLoading: isToggleUpdating } = useUpdateDomainToggles();

   const handleToggle = async (field: 'scrape_enabled' | 'notify_enabled', value: boolean) => {
      const payload = { [field]: value } as Partial<DomainSettings>;
      try {
         await updateDomainToggle({ domain, domainSettings: payload });
         const message = field === 'scrape_enabled'
            ? `${domain.domain} tracking ${value ? 'enabled' : 'paused'}.`
            : `${domain.domain} notifications ${value ? 'enabled' : 'paused'}.`;
         toast(message, { icon: '✔️' });
      } catch (error) {
         console.log('Error updating domain toggle', error);
      }
   };
   // const router = useRouter();
   return (
      <div className={`domItem bg-white border rounded w-full text-sm mb-10 hover:border-indigo-200 ${selected ? '' : ''}`}>
         <Link href={`/domain/${slug}`} className='flex flex-col lg:flex-row'>
            <div className={`flex-1 p-6 flex ${!isConsoleIntegrated ? 'basis-1/3' : ''}`}>
               <div className="group domain_thumb w-20 h-20 mr-6 bg-slate-100 rounded
                  border border-gray-200 overflow-hidden flex justify-center relative">
                  {screenshotsEnabled && (
                     <button
                        className=' absolute right-1 top-0 text-gray-400 p-1 transition-all
                        invisible opacity-0 group-hover:visible group-hover:opacity-100 hover:text-gray-600 z-10'
                        title='Reload Website Screenshot'
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateThumb(domain.domain); }}
                     >
                        <Icon type="reload" size={12} />
                     </button>
                  )}
                  <img
                  className={`self-center ${!thumb ? 'max-w-[50px]' : ''}`}
                  src={thumb || `https://www.google.com/s2/favicons?domain=${domain.domain}&sz=128`} alt={domain.domain}
                  />
               </div>
               <div className="domain_details flex-1">
                  <h3 className='font-semibold text-base mb-2 max-w-[200px] text-ellipsis overflow-hidden' title={domain.domain}>{domain.domain}</h3>
                 {keywordsUpdated && (
                  <span className=' text-gray-600 text-xs'>
                     Updated <TimeAgo title={dayjs(keywordsUpdated).format('DD-MMM-YYYY, hh:mm:ss A')} date={keywordsUpdated} />
                  </span>
                 )}
               </div>
            </div>
            <div className='flex-1 flex flex-col p-4'>
               <div className=' bg-indigo-50 p-1 px-2 text-xs rounded-full absolute ml-3 mt-[-8px]'>
                  <Icon type="tracking" size={13} color="#364aff" /> Tracker
               </div>
               <div className='dom_stats flex flex-1 font-semibold text-2xl p-4 pt-5 rounded border border-[#E9EBFF] text-center'>
                  <div className="flex-1 relative">
                     <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Keywords</span>{keywordCount}
                  </div>
                  <div className="flex-1 relative">
                     <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Avg position</span>{avgPosition}
                  </div>
               </div>
               <div className='mt-4 flex flex-col gap-3 text-xs'>
                  <ToggleField
                     label='Track keyword positions'
                     value={domain.scrape_enabled !== false}
                     onChange={(next) => handleToggle('scrape_enabled', next)}
                     disabled={isToggleUpdating}
                     stopPropagation
                  />
                  <ToggleField
                     label='Send notification emails'
                     value={domain.notify_enabled !== false && domain.notification !== false}
                     onChange={(next) => handleToggle('notify_enabled', next)}
                     disabled={isToggleUpdating}
                     stopPropagation
                  />
               </div>
            </div>
            {isConsoleIntegrated && (
               <div className='flex-1 flex-col p-4 lg:basis-56'>
                  <div className=' bg-indigo-50 p-1 px-2 text-xs rounded-full absolute ml-3 mt-[-8px]'>
                     <Icon type="google" size={13} /> Search Console (7d)
                  </div>
                  <div className='dom_sc_stats flex flex-1 h-full font-semibold text-2xl p-4 pt-5 rounded border border-[#E9EBFF] text-center'>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Visits</span>
                        {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(scVisits).replace('T', 'K')}
                     </div>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Impressions</span>
                        {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(scImpressions).replace('T', 'K')}
                     </div>
                     <div className="flex-1 relative">
                        <span className='block text-xs lg:text-sm text-gray-500 mb-1'>Avg position</span>
                        {scPosition}
                     </div>
                  </div>
               </div>
            )}
         </Link>
      </div>
   );
};

export default DomainItem;

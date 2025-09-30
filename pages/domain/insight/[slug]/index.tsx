import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
// import { useQuery } from 'react-query';
// import toast from 'react-hot-toast';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../../components/common/Sidebar';
import TopBar from '../../../../components/common/TopBar';
import DomainHeader from '../../../../components/domains/DomainHeader';
import AddDomain from '../../../../components/domains/AddDomain';
import DomainSettings from '../../../../components/domains/DomainSettings';
import exportCSV from '../../../../utils/client/exportcsv';
import Settings from '../../../../components/settings/Settings';
import { useFetchDomains } from '../../../../services/domains';
import { useFetchSCInsight } from '../../../../services/searchConsole';
import SCInsight from '../../../../components/insight/Insight';
import { useFetchSettings } from '../../../../services/settings';
import Footer from '../../../../components/common/Footer';
import { getBranding } from '../../../../utils/branding';

const { platformName } = getBranding();

const InsightPage: NextPage = () => {
   const router = useRouter();
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [scDateFilter, setSCDateFilter] = useState('thirtyDays');
   const { data: appSettings } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router, false);
   const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
   const activDomain: DomainType|null = useMemo(() => {
      if (domainsData?.domains && router.query?.slug) {
         return domainsData.domains.find((x:DomainType) => x.slug === router.query.slug) || null;
      }
      return null;
   }, [router.query.slug, domainsData]);
   const domainHasScAPI = useMemo(() => {
      const domainSc = activDomain?.search_console ? JSON.parse(activDomain.search_console) : {};
      return !!(domainSc?.client_email && domainSc?.private_key);
   }, [activDomain]);
   const scConnected = !!(appSettings && appSettings?.settings?.search_console_integrated);
   const domainsLoaded = !!(domainsData?.domains?.length);
   const { data: insightData } = useFetchSCInsight(
      router,
      domainsLoaded && scConnected,
      domainsLoaded && domainHasScAPI,
   );

   const theInsight: InsightDataType = insightData && insightData.data ? insightData.data : {};

   return (
      <div className="Domain ">
         {activDomain && activDomain.domain
         && <Head>
               <title>{`${activDomain.domain} - ${platformName}` } </title>
            </Head>
         }
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex desktop-container gap-6 lg:gap-10">
            <Sidebar domains={theDomains} showAddModal={() => setShowAddDomain(true)} />
            <div className="domain_kewywords w-full pt-10 lg:pt-8">
               {activDomain && activDomain.domain
               ? <DomainHeader
                  domain={activDomain}
                  domains={theDomains}
                  showAddModal={() => console.log('XXXXX')}
                  showSettingsModal={setShowDomainSettings}
                  exportCsv={() => exportCSV([], activDomain.domain, scDateFilter)}
                  scFilter={scDateFilter}
                  setScFilter={(item:string) => setSCDateFilter(item)}
                  />
                  : <div className='w-full lg:h-[100px]'></div>
               }
               <SCInsight
               isLoading={false}
               domain={activDomain}
               insight={theInsight}
               isConsoleIntegrated={scConnected || domainHasScAPI}
            />
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
            domain={showDomainSettings && theDomains && activDomain && activDomain.domain ? activDomain : null}
            closeModal={setShowDomainSettings}
            />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
         <Footer currentVersion={appSettings?.settings?.version ? appSettings.settings.version : ''} />
      </div>
   );
};

export default InsightPage;

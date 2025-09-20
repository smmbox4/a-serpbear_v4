import { writeFile, readFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import getConfig from 'next/config';
import verifyUser from '../../utils/verifyUser';
import allScrapers from '../../scrapers/index';

const SETTINGS_DEFAULTS: SettingsType = {
   scraper_type: 'none',
   scraping_api: '',
   proxy: '',
   notification_interval: 'never',
   notification_email: '',
   notification_email_from: '',
   notification_email_from_name: 'SerpBear',
   smtp_server: '',
   smtp_port: '',
   smtp_username: '',
   smtp_password: '',
   scrape_interval: '',
   scrape_delay: '',
   scrape_retry: false,
   search_console: true,
   search_console_client_email: '',
   search_console_private_key: '',
   adwords_client_id: '',
   adwords_client_secret: '',
   adwords_refresh_token: '',
   adwords_developer_token: '',
   adwords_account_id: '',
   keywordsColumns: ['Best', 'History', 'Volume', 'Search Console'],
};

type SettingsGetResponse = {
   settings?: object | null,
   error?: string,
   details?: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method === 'GET') {
      return getSettings(req, res);
   }
   if (req.method === 'PUT') {
      return updateSettings(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   try {
      const settings = await getAppSettings();
      if (!settings) {
         return res.status(500).json({ error: 'Settings could not be loaded.' });
      }
      const config = getConfig();
      const version = config?.publicRuntimeConfig?.version;
      return res.status(200).json({ settings: { ...settings, version } });
   } catch (error) {
      console.log('[ERROR] Loading App Settings. ', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to load settings.', details: message });
   }
};

const updateSettings = async (req: NextApiRequest, res: NextApiResponse<SettingsGetResponse>) => {
   const { settings } = req.body || {};
   // console.log('### settings: ', settings);
   if (!settings) {
      return res.status(400).json({ error: 'Settings payload is required.' });
   }
   try {
      const cryptr = new Cryptr(process.env.SECRET as string);
      const scraping_api = settings.scraping_api ? cryptr.encrypt(settings.scraping_api.trim()) : '';
      const smtp_password = settings.smtp_password ? cryptr.encrypt(settings.smtp_password.trim()) : '';
      const search_console_client_email = settings.search_console_client_email ? cryptr.encrypt(settings.search_console_client_email.trim()) : '';
      const search_console_private_key = settings.search_console_private_key ? cryptr.encrypt(settings.search_console_private_key.trim()) : '';
      const adwords_client_id = settings.adwords_client_id ? cryptr.encrypt(settings.adwords_client_id.trim()) : '';
      const adwords_client_secret = settings.adwords_client_secret ? cryptr.encrypt(settings.adwords_client_secret.trim()) : '';
      const adwords_developer_token = settings.adwords_developer_token ? cryptr.encrypt(settings.adwords_developer_token.trim()) : '';
      const adwords_account_id = settings.adwords_account_id ? cryptr.encrypt(settings.adwords_account_id.trim()) : '';

      const securedSettings = {
         ...settings,
         scraping_api,
         smtp_password,
         search_console_client_email,
         search_console_private_key,
         adwords_client_id,
         adwords_client_secret,
         adwords_developer_token,
         adwords_account_id,
      };

      await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(securedSettings), { encoding: 'utf-8' });
      return res.status(200).json({ settings });
   } catch (error) {
      console.log('[ERROR] Updating App Settings. ', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to update settings.', details: message });
   }
};

export const getAppSettings = async () : Promise<SettingsType> => {
   try {
      const settingsRaw = await readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
      const failedQueueRaw = await readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' });
      const failedQueue: string[] = failedQueueRaw ? JSON.parse(failedQueueRaw) : [];
      const settings: Partial<SettingsType> = settingsRaw ? JSON.parse(settingsRaw) : {};
      const baseSettings: SettingsType = { ...SETTINGS_DEFAULTS, ...settings };
      let decryptedSettings: SettingsType = baseSettings;

      try {
         const cryptr = new Cryptr(process.env.SECRET as string);
         const scraping_api = settings.scraping_api ? cryptr.decrypt(settings.scraping_api) : '';
         const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
         const search_console_client_email = settings.search_console_client_email ? cryptr.decrypt(settings.search_console_client_email) : '';
         const search_console_private_key = settings.search_console_private_key ? cryptr.decrypt(settings.search_console_private_key) : '';
         const adwords_client_id = settings.adwords_client_id ? cryptr.decrypt(settings.adwords_client_id) : '';
         const adwords_client_secret = settings.adwords_client_secret ? cryptr.decrypt(settings.adwords_client_secret) : '';
         const adwords_developer_token = settings.adwords_developer_token ? cryptr.decrypt(settings.adwords_developer_token) : '';
         const adwords_account_id = settings.adwords_account_id ? cryptr.decrypt(settings.adwords_account_id) : '';

         decryptedSettings = {
            ...baseSettings,
            scraping_api,
            smtp_password,
            search_console_client_email,
            search_console_private_key,
            adwords_client_id,
            adwords_client_secret,
            adwords_developer_token,
            adwords_account_id,
         };
      } catch (error) {
         console.log('Error Decrypting Settings API Keys!');
      }

      return {
         ...decryptedSettings,
         search_console_integrated:
            !!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL)
            || !!(decryptedSettings.search_console_client_email && decryptedSettings.search_console_private_key),
         available_scapers: allScrapers.map((scraper) => ({
            label: scraper.name,
            value: scraper.id,
            allowsCity: !!scraper.allowsCity,
         })),
         failed_queue: failedQueue,
      };
   } catch (error) {
      console.log('[ERROR] Getting App Settings. ', error);
      const defaults = { ...SETTINGS_DEFAULTS };
      await writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(defaults), { encoding: 'utf-8' });
      await writeFile(`${process.cwd()}/data/failed_queue.json`, JSON.stringify([]), { encoding: 'utf-8' });
      return {
         ...defaults,
         available_scapers: allScrapers.map((scraper) => ({
            label: scraper.name,
            value: scraper.id,
            allowsCity: !!scraper.allowsCity,
         })),
         failed_queue: [],
         search_console_integrated: false,
      };
   }
};

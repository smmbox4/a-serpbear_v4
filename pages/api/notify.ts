import type { NextApiRequest, NextApiResponse } from 'next';
import nodeMailer from 'nodemailer';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import generateEmail from '../../utils/generateEmail';
import parseKeywords from '../../utils/parseKeywords';
import verifyUser from '../../utils/verifyUser';
import { canSendEmail, recordEmailSent } from '../../utils/emailThrottle';
import { getAppSettings } from './settings';

type NotifyResponse = {
   success?: boolean
   error?: string|null,
}

const trimString = (value?: string | null): string => (typeof value === 'string' ? value.trim() : '');

const sanitizeHostname = (host?: string | null): string => {
   const trimmed = trimString(host);
   return trimmed.replace(/\.+$/, '');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ success: false, error: authorized });
   }
   if (req.method === 'POST') {
      return notify(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const notify = async (req: NextApiRequest, res: NextApiResponse<NotifyResponse>) => {
   const reqDomain = req?.query?.domain as string || '';
   try {
      const settings = await getAppSettings();
      const normalizedSettings: SettingsType = { ...settings };

      Object.entries(normalizedSettings).forEach(([key, value]) => {
         if (typeof value === 'string') {
            (normalizedSettings as Record<string, unknown>)[key] = value.trim();
         }
      });

      const sanitizedHost = sanitizeHostname(normalizedSettings.smtp_server);
      const sanitizedPort = trimString(normalizedSettings.smtp_port);
      const sanitizedDefaultEmail = trimString(normalizedSettings.notification_email);

      normalizedSettings.smtp_server = sanitizedHost;
      normalizedSettings.smtp_port = sanitizedPort;
      normalizedSettings.notification_email = sanitizedDefaultEmail;
      normalizedSettings.smtp_tls_servername = sanitizeHostname(normalizedSettings.smtp_tls_servername);

      if (!sanitizedHost || !sanitizedPort || !sanitizedDefaultEmail) {
         return res.status(401).json({ success: false, error: 'SMTP has not been setup properly!' });
      }

      if (reqDomain) {
         const theDomain = await Domain.findOne({ where: { domain: reqDomain } });
         if (theDomain) {
            const domainPlain = theDomain.get({ plain: true }) as DomainType;
            if (domainPlain.scrape_enabled !== false && domainPlain.notification !== false) {
               await sendNotificationEmail(domainPlain, normalizedSettings);
            }
         }
      } else {
         const allDomains: Domain[] = await Domain.findAll();
         if (allDomains && allDomains.length > 0) {
            const domains = allDomains.map((el) => el.get({ plain: true }));
            for (const domain of domains) {
               if (domain.scrape_enabled !== false && domain.notification !== false) {
                  await sendNotificationEmail(domain, normalizedSettings);
               }
            }
         }
      }

      return res.status(200).json({ success: true, error: null });
   } catch (error) {
      console.log(error);
      return res.status(401).json({ success: false, error: 'Error Sending Notification Email.' });
   }
};

const sendNotificationEmail = async (domain: DomainType | Domain, settings: SettingsType) => {
   const domainObj: DomainType = (domain as any).get ? (domain as any).get({ plain: true }) : domain as DomainType;
   const domainName = domainObj.domain;

   // Check email throttling
   const throttleCheck = await canSendEmail(domainName);
   if (!throttleCheck.canSend) {
      console.log(`[EMAIL_THROTTLE] Skipping email for ${domainName}: ${throttleCheck.reason}`);
      return;
   }

   const {
      smtp_server = '',
      smtp_port = '',
      smtp_username = '',
      smtp_password = '',
      notification_email = '',
      notification_email_from = '',
      notification_email_from_name = 'SerpBear',
      smtp_tls_servername = '',
     } = settings;

   if (!smtp_server) {
      throw new Error('Invalid SMTP host configured.');
   }

   const fromEmail = `${notification_email_from_name || 'SerpBear'} <${notification_email_from || 'no-reply@serpbear.com'}>`;
   const portNum = parseInt(smtp_port, 10);
   const validPort = isNaN(portNum) ? 587 : Math.max(1, Math.min(65535, portNum)); // Default to 587, validate range
   const mailerSettings:any = { host: smtp_server, port: validPort };
   if (smtp_tls_servername) {
      mailerSettings.tls = { servername: smtp_tls_servername };
   }
   if (smtp_username || smtp_password) {
      mailerSettings.auth = {};
      if (smtp_username) mailerSettings.auth.user = smtp_username;
      if (smtp_password) mailerSettings.auth.pass = smtp_password;
   }

   try {
      const transporter = nodeMailer.createTransport(mailerSettings);
      const query = { where: { domain: domainName } };
      const domainKeywords:Keyword[] = await Keyword.findAll(query);
      const keywordsArray = domainKeywords.map((el) => el.get({ plain: true }));
      const keywords: KeywordType[] = parseKeywords(keywordsArray);
      const emailHTML = await generateEmail(domainObj, keywords, settings);

      const domainNotificationEmails = trimString(domain.notification_emails);
      const fallbackNotification = notification_email;

      await transporter.sendMail({
         from: fromEmail,
         to: domainNotificationEmails || fallbackNotification,
         subject: `[${domainName}] Keyword Positions Update`,
         html: emailHTML,
      });
      
      // Record successful email send
      await recordEmailSent(domainName);
      console.log(`[EMAIL] Successfully sent notification for ${domainName}`);
      
   } catch (error:any) {
      console.log('[ERROR] Sending Notification Email for', domainName, error?.response || error);
      throw error; // Re-throw to let caller handle
   }
};

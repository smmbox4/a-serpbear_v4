import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';

type HealthResponse = {
   status: 'healthy' | 'unhealthy';
   timestamp: string;
   checks: {
      service: 'ok' | 'error';
      database: 'ok' | 'error';
   };
   error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
   if (req.method !== 'GET') {
      return res.status(405).json({
         status: 'unhealthy',
         timestamp: new Date().toISOString(),
         checks: {
            service: 'error',
            database: 'error',
         },
         error: 'Method not allowed',
      });
   }

   const timestamp = new Date().toISOString();
   const checks: {
      service: 'ok' | 'error';
      database: 'ok' | 'error';
   } = {
      service: 'ok',
      database: 'error',
   };

   // Test database connectivity
   try {
      await db.authenticate();
      checks.database = 'ok';
   } catch (error) {
      console.error('[HEALTH] Database check failed:', error);
   }

   const isHealthy = checks.service === 'ok' && checks.database === 'ok';

   return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      checks,
   });
}
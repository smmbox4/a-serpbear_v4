import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import sqliteDialect from '../../database/sqlite-dialect';
import { withApiLogging } from '../../utils/apiLogging';
import { logger } from '../../utils/logger';

type MigrationGetResponse = {
   hasMigrations: boolean,
}

type MigrationPostResponse = {
   migrated: boolean,
   migrationsRun: number,
   error?: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
   // Allow GET requests without authentication to check migration status
   if (req.method === 'GET') {
      await db.sync();
      return getMigrationStatus(req, res);
   }
   
   // All other methods require authentication
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   
   if (req.method === 'POST') {
      return migrateDatabase(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
};

const getMigrationStatus = async (req: NextApiRequest, res: NextApiResponse<MigrationGetResponse>) => {
   try {
      const sequelize = new Sequelize({ 
         dialect: 'sqlite', 
         dialectModule: sqliteDialect, 
         storage: './data/database.sqlite', 
         logging: false 
      });
      
      const umzug = new Umzug({
         migrations: { glob: 'database/migrations/*' },
         context: sequelize.getQueryInterface(),
         storage: new SequelizeStorage({ sequelize }),
         logger: undefined,
      });
      
      const migrations = await umzug.pending();
      await sequelize.close();
      
      logger.debug('Migration status check', {
         pendingMigrations: migrations.length,
         hasMigrations: migrations.length > 0
      });
      
      return res.status(200).json({ hasMigrations: migrations.length > 0 });
   } catch (error) {
      logger.error('Failed to check migration status', error instanceof Error ? error : new Error(String(error)));
      return res.status(500).json({ hasMigrations: false });
   }
};

const migrateDatabase = async (req: NextApiRequest, res: NextApiResponse<MigrationPostResponse>) => {
   try {
      logger.info('Starting database migration');
      
      const sequelize = new Sequelize({ 
         dialect: 'sqlite', 
         dialectModule: sqliteDialect, 
         storage: './data/database.sqlite', 
         logging: false 
      });
      
      const umzug = new Umzug({
         migrations: { glob: 'database/migrations/*' },
         context: sequelize.getQueryInterface(),
         storage: new SequelizeStorage({ sequelize }),
         logger: undefined,
      });
      
      const migrations = await umzug.up();
      await sequelize.close();
      
      logger.info('Database migration completed successfully', {
         migrationsRun: migrations.length,
         migrations: migrations.map(m => m.name)
      });
      
      return res.status(200).json({ 
         migrated: true, 
         migrationsRun: migrations.length 
      });
   } catch (error) {
      logger.error('Database migration failed', error instanceof Error ? error : new Error(String(error)));
      return res.status(500).json({ 
         migrated: false, 
         migrationsRun: 0,
         error: 'Migration failed' 
      });
   }
};

export default withApiLogging(handler, { 
   name: 'dbmigrate',
   logBody: false 
});

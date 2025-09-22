import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import verifyUser from '../../utils/verifyUser';
import sqliteDialect from '../../database/sqlite-dialect';

type MigrationGetResponse = {
   hasMigrations: boolean,
}

type MigrationPostResponse = {
   migrated: boolean,
   error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getMigrationStatus = async (req: NextApiRequest, res: NextApiResponse<MigrationGetResponse>) => {
   const sequelize = new Sequelize({ dialect: 'sqlite', dialectModule: sqliteDialect, storage: './data/database.sqlite', logging: false });
   const umzug = new Umzug({
      migrations: { glob: 'database/migrations/*' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: undefined,
   });
   const migrations = await umzug.pending();
   // console.log('migrations :', migrations);
   // const migrationsExceuted = await umzug.executed();
   return res.status(200).json({ hasMigrations: migrations.length > 0 });
};

const migrateDatabase = async (req: NextApiRequest, res: NextApiResponse<MigrationPostResponse>) => {
   const sequelize = new Sequelize({ dialect: 'sqlite', dialectModule: sqliteDialect, storage: './data/database.sqlite', logging: false });
   const umzug = new Umzug({
      migrations: { glob: 'database/migrations/*' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: undefined,
   });
   const migrations = await umzug.up();
   console.log('[Updated] migrations :', migrations);
   return res.status(200).json({ migrated: true });
};

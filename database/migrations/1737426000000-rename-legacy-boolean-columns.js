// Migration: Renames legacy snake_case boolean columns to camelCase equivalents while preserving constraints

module.exports = {
   up: async function up(params = {}, legacySequelize) {
      const queryInterface = params?.context ?? params;
      const SequelizeLib =
         params?.Sequelize
         ?? legacySequelize
         ?? queryInterface?.sequelize?.constructor
         ?? require('sequelize');

      return queryInterface.sequelize.transaction(async (transaction) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            const domainTableDefinition = await queryInterface.describeTable('domain');

            const hasLegacyKeywordFlag = Object.prototype.hasOwnProperty.call(keywordTableDefinition, 'map_pack_top3');
            const hasCamelKeywordFlag = Object.prototype.hasOwnProperty.call(keywordTableDefinition, 'mapPackTop3');

            if (hasLegacyKeywordFlag) {
               await queryInterface.renameColumn('keyword', 'map_pack_top3', 'mapPackTop3', { transaction });
            }

            if (hasLegacyKeywordFlag || hasCamelKeywordFlag) {
               await queryInterface.changeColumn(
                  'keyword',
                  'mapPackTop3',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: false,
                     defaultValue: false,
                  },
                  { transaction }
               );
            }

            const hasLegacyDomainFlag = Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrape_enabled');
            const hasCamelDomainFlag = Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrapeEnabled');

            if (hasLegacyDomainFlag) {
               await queryInterface.renameColumn('domain', 'scrape_enabled', 'scrapeEnabled', { transaction });
            }

            if (hasLegacyDomainFlag || hasCamelDomainFlag) {
               await queryInterface.changeColumn(
                  'domain',
                  'scrapeEnabled',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: false,
                     defaultValue: true,
                  },
                  { transaction }
               );
            }
         } catch (error) {
            console.log('Migration error:', error);
            throw error;
         }
      });
   },

   down: async function down(params = {}, legacySequelize) {
      const queryInterface = params?.context ?? params;
      const SequelizeLib =
         params?.Sequelize
         ?? legacySequelize
         ?? queryInterface?.sequelize?.constructor
         ?? require('sequelize');

      return queryInterface.sequelize.transaction(async (transaction) => {
         try {
            const keywordTableDefinition = await queryInterface.describeTable('keyword');
            const domainTableDefinition = await queryInterface.describeTable('domain');

            const hasCamelKeywordFlag = Object.prototype.hasOwnProperty.call(keywordTableDefinition, 'mapPackTop3');
            if (hasCamelKeywordFlag) {
               await queryInterface.renameColumn('keyword', 'mapPackTop3', 'map_pack_top3', { transaction });
               await queryInterface.changeColumn(
                  'keyword',
                  'map_pack_top3',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: false,
                     defaultValue: false,
                  },
                  { transaction }
               );
            }

            const hasCamelDomainFlag = Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrapeEnabled');
            if (hasCamelDomainFlag) {
               await queryInterface.renameColumn('domain', 'scrapeEnabled', 'scrape_enabled', { transaction });
               await queryInterface.changeColumn(
                  'domain',
                  'scrape_enabled',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: false,
                     defaultValue: true,
                  },
                  { transaction }
               );
            }
         } catch (error) {
            console.log('Migration rollback error:', error);
            throw error;
         }
      });
   },
};

// Migration: Ensures camelCase boolean columns are authoritative and removes legacy snake_case boolean identifiers

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

            const hasCamelKeywordFlag = Object.prototype.hasOwnProperty.call(keywordTableDefinition, 'mapPackTop3');

            if (hasCamelKeywordFlag) {
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

            const hasCamelDomainFlag = Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrapeEnabled');

            if (hasCamelDomainFlag) {
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

            if (Object.prototype.hasOwnProperty.call(keywordTableDefinition, 'map_pack_top3')) {
               await queryInterface.removeColumn('keyword', 'map_pack_top3', { transaction });
            }

            if (Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrape_enabled')) {
               await queryInterface.removeColumn('domain', 'scrape_enabled', { transaction });
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
               await queryInterface.changeColumn(
                  'keyword',
                  'mapPackTop3',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: true,
                     defaultValue: false,
                  },
                  { transaction }
               );
            }

            const hasCamelDomainFlag = Object.prototype.hasOwnProperty.call(domainTableDefinition, 'scrapeEnabled');
            if (hasCamelDomainFlag) {
               await queryInterface.changeColumn(
                  'domain',
                  'scrapeEnabled',
                  {
                     type: SequelizeLib.DataTypes.BOOLEAN,
                     allowNull: true,
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

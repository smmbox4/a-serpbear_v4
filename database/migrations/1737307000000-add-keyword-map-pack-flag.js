module.exports = {
   up: async function up(params = {}, legacySequelize) {
      const queryInterface = params?.context ?? params;
      const SequelizeLib = params?.Sequelize
         ?? legacySequelize
         ?? queryInterface?.sequelize?.constructor
         ?? require('sequelize');

      return queryInterface.sequelize.transaction(async (transaction) => {
         const keywordTableDefinition = await queryInterface.describeTable('keyword');

         if (!keywordTableDefinition?.map_pack_top3) {
            await queryInterface.addColumn(
               'keyword',
               'map_pack_top3',
               {
                  type: SequelizeLib.DataTypes.BOOLEAN,
                  allowNull: true,
                  defaultValue: false,
               },
               { transaction }
            );
         }

         await queryInterface.sequelize.query(
            [
               'UPDATE keyword',
               'SET map_pack_top3 = 0',
               'WHERE map_pack_top3 IS NULL',
            ].join(' '),
            { transaction }
         );
      });
   },

   down: async function down(params = {}) {
      const queryInterface = params?.context ?? params;

      return queryInterface.sequelize.transaction(async (transaction) => {
         const keywordTableDefinition = await queryInterface.describeTable('keyword');

         if (keywordTableDefinition?.map_pack_top3) {
            await queryInterface.removeColumn('keyword', 'map_pack_top3', { transaction });
         }
      });
   },
};

/*
 * Custom_Reports
 */
const AB = require("@digiserve/ab-utils");
const env = AB.defaults.env;

module.exports = {
   custom_reports: {
      /*************************************************************************/
      /* enable: {bool} is this service active?                                */
      /*************************************************************************/
      enable: env("CUSTOM_REPORTS_ENABLE", true),
   },

   /**
    * datastores:
    * Sails style DB connection settings
    */
   datastores: AB.defaults.datastores(),
};

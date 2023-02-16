module.exports = {
   valueFormat: (number) => {
      if (number == null) return;
      else if (!number.toLocaleString) number = parseFloat(number);

      return number.toLocaleString("en-US", { minimumFractionDigits: 2 });
   },

   getData: async (req, objectID, cond = {}) => {
      return new Promise((resolve, reject) => {
         req.serviceRequest(
            "appbuilder.model-get",
            { objectID, cond },
            (err, results) => {
               err ? reject(err) : resolve(results?.data ?? []);
            }
         );
      });
   }
};

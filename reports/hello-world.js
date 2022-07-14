const path = require("path");
const fs = require("fs");
module.exports = {
   prepareData: async (AB, { input }) => {
      const data = {
         payee: input,
      };
      console.log("file from hello world");
      // console.log(AB);
      return { output: "earth" };
   },
   template: () => {
      return fs.readFileSync(
         path.join(__dirname, "templates", "hello-world.ejs"),
         "utf8"
      );
   },
};

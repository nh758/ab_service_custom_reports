const fs = require("fs");
const { result, head, startsWith } = require("lodash");
const path = require("path");

const OBJECT_IDS = {
   FY_MONTH: "1d63c6ac-011a-4ffd-ae15-97e5e43f2b3f",
};

function valueFormat(number) {
   if (number == null) return;

   return number.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

function GetFYMonths(AB) {
   const objFYMonth = AB.objectByID(OBJECT_IDS.FY_MONTH).model();

   if (objFYMonth == null) {
      console.error("null value");
      return Promise.resolve([]);
   }

   return new Promise((next, bad) => {
      objFYMonth

         .findAll({
            where: {
               glue: "or",
               rules: [
                  {
                     key: "Status",
                     rule: "equals",
                     value: "1592549786113",
                  },
                  {
                     key: "Status",
                     rule: "equals",
                     value: "1592549785939",
                  },
                  {
                     key: "Status",
                     rule: "equals",
                     value: "1592549785894",
                  },
               ],
            },
            populate: false,
            sort: [
               {
                  key: "49d6fabe-46b1-4306-be61-1b27764c3b1a",
                  dir: "DESC",
               },
            ],
            limit: 12,
         })
         .then((list) => {
            next(list.map((item) => item["FY Per"]));
         })
         .catch(bad);
   });
}
function valueFormat(number) {
   if (number == null) return;

   return number.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

module.exports = {
   prepareData: async (AB, { fyPeriod, ministryValue }) => {
      const result = {};

      const projectObj = AB.objectByID(
         "839ac470-8f77-420c-9a30-aeaf0a9f509c"
      ).model();

      const GLTransactObj = AB.queryByID(
         "cb59abf7-3f00-4e05-92f9-7f2db8672274"
      ).model();

      const cond = {
         glue: "or",
         rules: [],
      };

      cond.rules.push(
         {
            key: "69133f41-7c12-44af-bd59-426a723f5e1e",
            rule: "begins_with",
            value: "7",
         },
         {
            key: "69133f41-7c12-44af-bd59-426a723f5e1e",
            rule: "begins_with",
            value: "8",
         }
      );

      if (fyPeriod) {
         cond.rules.push({
            key: "549ab4ac-f436-461d-9777-505d6dc1d4f7",
            rule: "equals",
            value: fyPeriod,
         });
      }

      const GLTransactData = await GLTransactObj.findAll({
         where: cond,
         populate: true,
      });

      //----------------Set Default Ministry Team ---------------//
      const TeamsData = await projectObj.findAll({
         populate: true,
      });
      function defaultMTlist() {
         let showTList;
         for (i = 0; i < TeamsData.length; i++) {
            showTList = TeamsData[i]["Ministry Team"];
            return showTList;
         }
      }

      //------------Function Get Ministry Team Select List-------------//
      function getMTLists() {
         return new Promise((next, bad) => {
            projectObj
               .findAll({
                  populate: true,
               })
               .then((list) => {
                  const uniqList = [];
                  (list ?? []).forEach((item) => {
                     if (
                        !uniqList.filter(
                           (i) => i["Ministry Team"] == item["Ministry Team"]
                        ).length
                     )
                        uniqList.push(item);
                  });
                  next(uniqList);
               })
               .catch(bad);
         });
      }

      function getRCLists() {
         const where = {
            glue: "and",
            rules: [],
         };

         if (ministryValue) {
            where.rules.push({
               key: "Ministry Team",
               rule: "equals",
               value: ministryValue,
            });
         }

         return new Promise((next, bad) => {
            projectObj
               .findAll({
                  where: where,
                  populate: true,
               })
               .then((list) => {
                  next(list);
               })
               .catch(bad);
         });
      }

      const where = {
         glue: "and",
         rules: [],
      };

      if (
         ministryValue == "" ||
         ministryValue == null ||
         ministryValue == undefined
      ) {
         ministryValue = defaultMTlist();
      }

      if (ministryValue) {
         where.rules.push({
            key: "Ministry Team",
            rule: "equals",
            value: ministryValue,
         });
      }

      const filterGLTransactData = GLTransactData.filter(function (item) {
         let keyIndex = null;

         for (key in item)
            if (key.includes("Project Number")) {
               keyIndex = key;
               break;
            }

         return item[keyIndex];
      });

      where.rules.push({
         key: "3bb80108-b29b-4141-a84e-646bcbab98bf",
         rule: "in",
         value: GLTransactData.filter(function (item) {
            let keyIndex = null;

            for (const key in item)
               if (key.includes("Project Number")) {
                  keyIndex = key;
                  break;
               }

            return item[keyIndex];
         }).map((e) => {
            let keyIndex = null;

            for (const key in e)
               if (key.includes("Project Number")) {
                  keyIndex = key;
                  break;
               }

            return e[keyIndex];
         }),
      });

      const FilterOutRC = [
         "06 : Q100-QX MT",
         "02 : Q5CD-South Campus MT",
         "02 : Q5CD-North Campus MT",
         "02 : Q3SY-XSM city cross MT",
         "02 : Q3SY-SSN non-cross MT",
         "02 : Q3SY-SIE non-cross MT",
         "02 : Q3SY-SAU non-cross MT",
         "02 : Q3SY-DDU non-cross MT",
         "02 : Q3NM-HNM non-cross MT",
         "02 : Q3NM-HNM cross MT",
         "02 : Q3HB-HEB non-cross MT",
         "02 : Q3HB-HEB cross MT",
         "02 : Q3DL-DDL non-cross MT",
         "02 : Q3DL-DDL cross MT",
         "02 : Q3CC-CC non-cross MT",
         "02 : Q3CC-CC cross MT",
         "02 : Q1BJ-Domestic MT",
         "02 : Q1BJ-2016CP XJ MT",
         "02 : Q1BJ-2013SC MT-KuangDa",
         "02 : Q1BJ-2013Bangladesh MT",
      ];

      where.rules.push({
         key: "RC",
         rule: "not_in",
         value: FilterOutRC,
      });

      const projectData = await projectObj.findAll({
         where: where,
         populate: true,
      });

      function objectLength(obj) {
         var result = 0;
         for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
               result++;
            }
         }
         return result;
      }

      //------------Function Sum Total Budget Amount-------------//
      function sumTotalAmount() {
         let sum = 0;

         Object.keys(projectData).forEach((QX) => {
            if ((projectData[QX]["RC"] = projectData[QX]["RC"] ?? [])) {
               sum += projectData[QX]["Income Total Amount"];
            } else {
               projectData[QX]["Income Total Amount"];
            }
         });
         return sum;
      }
      //------------Function Sum total Group Expense Amount------------//
      function sumGroupTotalExpense() {
         let sum = 0;
         projectData.forEach((e) => {
            const data = filterGLTransactData.filter((gt) => {
               let keyIndex = null;

               for (const key in gt)
                  if (key.includes("Project Number")) {
                     keyIndex = key;
                     break;
                  }

               return gt[keyIndex] === e["Project Number"];
            })[0];

            const newData = {
               projectBud: e,
               gL: data,
            };

            const sumExpense =
               newData.gL["BASE_OBJECT.Debit"] -
               newData.gL["BASE_OBJECT.Credit"];
            sum += sumExpense;
         });
         return sum;
      }
      //--------------Function Sum Total Group Budget Amount--------------//
      function sumGroupTotalbudget() {
         let sum = 0;
         projectData.forEach((e) => {
            const data = filterGLTransactData.filter((gt) => {
               let keyIndex = null;

               for (const key in gt)
                  if (key.includes("Project Number")) {
                     keyIndex = key;
                     break;
                  }

               return gt[keyIndex] === e["Project Number"];
            })[0];

            const newData = {
               projectBud: e,
               gL: data,
            };

            const sumGBudget = newData.projectBud["Income Total Amount"];
            sum += sumGBudget;
         });
         return sum;
      }

      //------------Function Get Team Name-------------//
      function getTeamLists() {
         const where = {
            glue: "and",
            rules: [],
         };

         if (ministryValue) {
            where.rules.push({
               key: "Ministry Team",
               rule: "equals",
               value: ministryValue,
            });
         }

         const FilterOutRC = [
            "06 : Q100-QX MT",
            "02 : Q5CD-South Campus MT",
            "02 : Q5CD-North Campus MT",
            "02 : Q3SY-XSM city cross MT",
            "02 : Q3SY-SSN non-cross MT",
            "02 : Q3SY-SIE non-cross MT",
            "02 : Q3SY-SAU non-cross MT",
            "02 : Q3SY-DDU non-cross MT",
            "02 : Q3NM-HNM non-cross MT",
            "02 : Q3NM-HNM cross MT",
            "02 : Q3HB-HEB non-cross MT",
            "02 : Q3HB-HEB cross MT",
            "02 : Q3DL-DDL non-cross MT",
            "02 : Q3DL-DDL cross MT",
            "02 : Q3CC-CC non-cross MT",
            "02 : Q3CC-CC cross MT",
            "02 : Q1BJ-Domestic MT",
            "02 : Q1BJ-2016CP XJ MT",
            "02 : Q1BJ-2013SC MT-KuangDa",
            "02 : Q1BJ-2013Bangladesh MT",
         ];

         where.rules.push({
            key: "RC",
            rule: "not_in",
            value: FilterOutRC,
         });

         GLTransactData.filter(function (item) {
            let keyIndex = null;

            for (key in item)
               if (key.includes("Project Number")) {
                  keyIndex = key;
                  break;
               }

            return item[keyIndex];
         });

         where.rules.push({
            key: "3bb80108-b29b-4141-a84e-646bcbab98bf",
            rule: "in",
            value: GLTransactData.filter(function (item) {
               let keyIndex = null;

               for (const key in item)
                  if (key.includes("Project Number")) {
                     keyIndex = key;
                     break;
                  }

               return item[keyIndex];
            }).map((e) => {
               let keyIndex = null;

               for (const key in e)
                  if (key.includes("Project Number")) {
                     keyIndex = key;
                     break;
                  }

               return e[keyIndex];
            }),
         });

         return new Promise((next, bad) => {
            projectObj
               .findAll({
                  where: where,
                  populate: true,
               })
               .then((list) => {
                  const uniqList = [];
                  (list ?? []).forEach((item) => {
                     if (!uniqList.filter((i) => i["RC"] == item["RC"]).length)
                        uniqList.push(item);
                  });
                  next(uniqList);
               })
               .catch(bad);
         });
      }
      function showTeamSumTotal() {
         for (i = 0; i < projectData.length; i++) {
            const showTeamList = projectData[i]["RC"];

            let SumTeamTotal = 0;
            Object.keys(projectData).forEach((QX) => {
               var Team_lists = projectData[QX]["RC"];

               if (showTeamList == Team_lists) {
                  SumTeamTotal += projectData[QX]["Income Total Amount"];
               } else {
                  if (showTeamList != Team_lists) {
                     SumTeamTotal += projectData[QX]["Income Total Amount"];
                  }
               }
            });
            return SumTeamTotal;
         }
      }

      const data = {
         data: result,
      };

      data.projectData = projectData;
      data.GLTransactData = GLTransactData;
      data.filterGLTransactData = filterGLTransactData;
      data.fnValueFormat = valueFormat;
      data.showTeamSumTotal = showTeamSumTotal();
      data.objectLength = objectLength(projectData);
      data.fyPeriod = fyPeriod;
      if (
         ministryValue == "" ||
         ministryValue == null ||
         ministryValue == undefined
      ) {
         data.showMTHead = defaultMTlist();
      } else {
         data.showMTHead = ministryValue;
      }
      data.getRCLists = await getRCLists();
      data.sumTotalAmount = sumTotalAmount();
      data.sumGroupTotalExpense = sumGroupTotalExpense();
      data.sumGroupTotalbudget = sumGroupTotalbudget();
      data.getTeamLists = await getTeamLists();
      data.getMTLists = await getMTLists();
      data.fyOptions = await GetFYMonths(AB);

      return data;
   },

   template: () => {
      return fs.readFileSync(
         path.join(__dirname, "templates", "budget-vs-expense.ejs"),
         "utf8"
      );
   },
};

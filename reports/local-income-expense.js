/**
 * localIncomeExpense
 *
 *
 */
const fs = require("fs");
const path = require("path");

module.exports = {
   // GET: /report/local-income-expense
   // get the local and expense income and calculate the sums
   prepareData: async (AB, { rc, fyper }) => {
      // get our passed params
      rc = rc ? rc : undefined;
      fyper = fyper ? fyper : undefined;

      const ids = {
         myRCsQueryId: "241a977c-7748-420d-9dcb-eff53e66a43f",
         balanceObjId: "bb9aaf02-3265-4b8c-9d9a-c0b447c2d804",
         fiscalMonthObjId: "1d63c6ac-011a-4ffd-ae15-97e5e43f2b3f",
      };
      // Our data object
      var data = {
         title: {
            en: "Local Income vs Expense",
            zh: "本地收入VS 支出",
         },
         rc: rc,
         total: {
            en: "Total",
            zh: "总额",
         },
         category: {
            en: "Category",
            zh: "类别",
         },
         categories: [
            {
               parent: 4111,
               type: "Local Income",
               translation: {
                  en: "Local Income ",
                  zh: "本地收入",
               },
               sub: [
                  {
                     id: 41113,
                     translation: {
                        en: "General Contribution Local From Ch",
                        zh: "本地收到给事工的捐款-从国内收到",
                     },
                  },
                  {
                     id: 41114,
                     translation: {
                        en: "General Contribution Local From Oversea",
                        zh: "本地收到给事工的捐款-收到海外的汇款",
                     },
                  },
               ],
            },
            {
               parent: 7,
               type: "Expenses",
               translation: {
                  en: "Expenses ",
                  zh: "支出",
               },
               sub: [
                  {
                     id: 71,
                     translation: {
                        en: "Personnel expenses",
                        zh: "工资/福利",
                     },
                  },
                  {
                     id: 72,
                     translation: {
                        en: "Conferences and meetings",
                        zh: "大会和会议费用",
                     },
                  },
                  {
                     id: 75,
                     translation: {
                        en: "Travel and transportation",
                        zh: "差旅费",
                     },
                  },
                  {
                     id: 81,
                     translation: {
                        en: "Supplies and non-capitalized equipment",
                        zh: "设备及维修保养",
                     },
                  },
                  {
                     id: 82,
                     translation: {
                        en: "Communications",
                        zh: "电话和通信",
                     },
                  },
                  {
                     id: 84,
                     translation: {
                        en: "Professional services",
                        zh: "专业费用",
                     },
                  },
                  {
                     id: 86,
                     translation: {
                        en: "Capital expenses",
                        zh: "固定资产支出",
                     },
                  },
                  {
                     id: 87,
                     translation: {
                        en: "Facilities",
                        zh: "设施费用",
                     },
                  },
                  {
                     id: 89,
                     translation: {
                        en: "Other expenses",
                        zh: "其他费用",
                     },
                  },
               ],
            },
         ],
      };
      function accountInCategory(account, category) {
         const accountDigits = account.toString().split("");
         const categoryDigits = category.toString().split("");
         let match = true;
         categoryDigits.forEach((digit, i) => {
            if (digit !== accountDigits[i]) {
               match = false;
            }
         });
         return match;
      }

      function categorySum(category, balances) {
         const filtered = balances.filter((bal) =>
            accountInCategory(bal["COA Num"], category)
         );
         if (filtered.length > 0) {
            return filtered
               .map((i) => i["Running Balance"])
               .reduce((a, b) => (100 * a + 100 * b) / 100);
         } else {
            return 0;
         }
      }

      const myRCs = AB.queryByID(ids.myRCsQueryId).model();
      const balanceObj = AB.objectByID(ids.balanceObjId).model();
      const fiscalMonthObj = AB.objectByID(ids.fiscalMonthObjId).model();

      const [rcs, fiscalMonthsArray] = await Promise.all([
         // return myRCs
         myRCs.findAll(
            {
               // where: {
               //    glue: "and",
               //    rules: [],
               // },
            },
            { user: AB.id },
            AB.req
         ),
         fiscalMonthObj // .modelAPI()
            .findAll(
               {
                  where: {
                     glue: "and",
                     rules: [
                        {
                           key: "Status",
                           rule: "equals",
                           value: "1592549786113",
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
               },
               { user: AB.id },
               AB.req
            ),
      ]);

      [data.rc, data.fiscalPeriodstart] = await Promise.all([
         new Promise((resolve, reject) => {
            if (!rcs || !rcs.length) {
               reject(new Error("My Team RCs not found"));
            }

            let rcOptions = [];
            rcs.forEach((rcData) => {
               rcOptions.push(rcData["BASE_OBJECT.RC Name"]);
            });

            data.rcOptions = rcOptions.sort(function (a, b) {
               return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            if (!rc) {
               rc = data.rcOptions[0];
            }
            resolve(rc);
         }),
         new Promise((resolve, reject) => {
            if (!fiscalMonthsArray || !fiscalMonthsArray.length) {
               reject(new Error("Fiscal Months not found"));
            }

            data.fyper = fyper || fiscalMonthsArray[0]["FY Per"];
            let fiscalPeriodOptions = [];
            let i = 0;
            let currIndex = 0;
            fiscalMonthsArray.forEach((fp) => {
               var dateObj = new Date(fp["End"]);
               var month = dateObj.getUTCMonth() + 1; //months from 1-12
               var year = dateObj.getUTCFullYear();
               var prettyDate = year + "/" + (month > 9 ? month : "0" + month);
               var option = { id: fp["FY Per"], label: prettyDate };
               if (fyper == fp["FY Per"]) {
                  option.selected = true;
                  currIndex = i;
               }
               fiscalPeriodOptions.push(option);
               i++;
            });
            data.fiscalPeriodOptions = fiscalPeriodOptions;
            var dateObj = new Date(fiscalMonthsArray[currIndex]["End"]);
            var month = dateObj.getUTCMonth() + 1; //months from 1-12
            var year = dateObj.getUTCFullYear();
            data.fiscalPeriodend =
               year + "/" + (month > 9 ? month : "0" + month);
            let startYear = year;
            if (month < 7) {
               startYear = year - 1;
            }
            resolve(startYear + "/07");
         }),
      ]);

      let records = await balanceObj.findAll(
         {
            where: {
               glue: "and",
               rules: [
                  {
                     key: "RC Code",
                     rule: "equals",
                     value: rc,
                  },
                  {
                     key: "FY Period",
                     rule: "equals",
                     value: data.fyper,
                  },
               ],
            },
            populate: false,
         },
         { user: AB.id },
         AB.req
      );

      data.categories.forEach((cat) => {
         let catSum = 0;
         cat.sub.forEach((sub) => {
            sub.sum = categorySum(sub.id, records);
            catSum = (100 * sub.sum + 100 * catSum) / 100;
         });
         cat.sum = catSum;
      });

      data.localPercentage = Math.floor(
         (data.categories[0].sum / data.categories[1].sum) * 100
      );

      return data;
   },
   template: () => {
      return fs.readFileSync(
         path.join(__dirname, "templates", "local-income-expense.ejs"),
         "utf8"
      );
   },
};

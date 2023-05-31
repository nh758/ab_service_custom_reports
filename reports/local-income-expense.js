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
   prepareData: async (AB, { rc, fyYear, team, fyMonth }, req) => {
      // get our passed params
      rc = rc ? rc : undefined;
      fyYear = fyYear ? fyYear : undefined;
      team = team ? team : undefined;
      fyMonth = fyMonth ? fyMonth : undefined;

      const ids = {
         myRCsQueryId: "241a977c-7748-420d-9dcb-eff53e66a43f",
         balanceObjId: "bb9aaf02-3265-4b8c-9d9a-c0b447c2d804",
         fiscalMonthObjId: "1d63c6ac-011a-4ffd-ae15-97e5e43f2b3f",
         teamsObjId: "138ff828-4579-412b-8b5b-98542d7aa152",
         yearObjId: "6c398e8f-ddde-4e26-b142-353de5b16397",
         rcObjectID: "c3aae079-d36d-489f-ae1e-a6289536cb1a",
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
      function GetMonthList() {
         var array = [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
         ];

         array.sort();
         return array;
      }
      const myRCs = AB.queryByID(ids.myRCsQueryId).model();
      const balanceObj = AB.objectByID(ids.balanceObjId).model();
      const fiscalMonthObj = AB.objectByID(ids.fiscalMonthObjId).model();
      const teamsObj = AB.objectByID(ids.teamsObjId).model();
      const yearObj = AB.objectByID(ids.yearObjId).model();
      const RcObj = AB.objectByID(ids.rcObjectID).model();

      const [teamsArray, rcs, yearArray, fiscalMonthsArray] = await Promise.all(
         [
            // return teams
            teamsObj.findAll(
               {
                  populate: false,
               },
               { username: req._user.username },
               AB.req
            ),

            // return myRCs
            myRCs.findAll(
               {
                  // where: {
                  //    glue: "and",
                  //    rules: [],
                  // },
               },
               { username: req._user.username },
               AB.req
            ),
            // return year
            yearObj.findAll(
               {
                  populate: false,
               },
               { username: req._user.username },
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
                  { username: req._user.username },
                  AB.req
               ),
         ]
      );

      [data.team, data.fyYear, data.fyMonth] = await Promise.all([
         new Promise((resolve, reject) => {
            if (!teamsArray || !teamsArray.length) {
               reject(new Error("Ministry Team not found"));
            }

            let teamOptions = [];
            teamsArray.forEach((teamsData) => {
               teamOptions.push(teamsData["Name"]);
            });

            data.teamOptions = teamOptions.sort(function (a, b) {
               return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            if (!team) {
               team = data.teamOptions[null];
            }
            resolve(team);
         }),
         new Promise((resolve, reject) => {
            if (!yearArray || !yearArray.length) {
               reject(new Error("Year not found"));
            }

            let yearOptions = [];
            yearArray.forEach((yearData) => {
               yearOptions.push(yearData["FYear"]);
            });

            data.yearOptions = yearOptions.sort(function (a, b) {
               return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            if (!fyYear) {
               fyYear = data.yearOptions[null];
            }
            resolve(fyYear);
         }),
         new Promise((resolve, reject) => {
            if (!fiscalMonthsArray || !fiscalMonthsArray.length) {
               reject(new Error("Month not found"));
            }

            resolve(fyMonth);
         }),
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
               rc = data.rcOptions[null];
            }
            resolve(rc);
         }),

         new Promise((resolve, reject) => {
            if (!fiscalMonthsArray || !fiscalMonthsArray.length) {
               reject(new Error("Fiscal Months not found"));
            }

            data.year = year || fiscalMonthsArray[0]["FY Per"];
            let fiscalPeriodOptions = [];
            let i = 0;
            let currIndex = 0;
            fiscalMonthsArray.forEach((fp) => {
               var dateObj = new Date(fp["End"]);
               var month = dateObj.getUTCMonth() + 1; //months from 1-12
               var year = dateObj.getUTCFullYear();
               var prettyDate = year + "/" + (month > 9 ? month : "0" + month);
               var option = { id: fp["FY Per"], label: prettyDate };
               if (year == fp["FY Per"]) {
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

      const GetRcObject = await RcObj.findAll({
         populate: false,
      });

      const where = {
         glue: "and",
         rules: [],
      };

      if (team) {
         let teamListObjs = [];
         for (let i = 0; i < GetRcObject.length; i++) {
            if (GetRcObject[i]["Responsibility Center406"] === team) {
               teamListObjs.push(GetRcObject[i]["RC Name"]);
            }
         }
         where.rules.push({
            key: "RC Code",
            rule: "equals",
            value: teamListObjs,
         });
      }

      if (rc) {
         if (rc !== "all") {
            where.rules.push({
               key: "RC Code",
               rule: "equals",
               value: rc,
            });
         }
      }

      if (fyYear) {
         where.rules.push({
            key: "FY Period",
            rule: "contains",
            value: fyYear,
         });
      }

      if (fyMonth) {
         if (fyYear === undefined) {
            let CurrentYear = new Date().getFullYear();
            fyYear = CurrentYear;
         }

         const monthJoin = `${fyYear} M${fyMonth}`;
         where.rules.push({
            key: "FY Period",
            rule: "contains",
            value: monthJoin,
         });
      }

      let records = await balanceObj.findAll(
         {
            where: where,
            populate: false,
         },
         { username: req._user.username },
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

      // Local Income / Expenses
      let localIncomeSum = data.categories[0].sum;
      let expensesSum = data.categories[1].sum;

      data.localPercentage = Math.floor((localIncomeSum / expensesSum) * 100);

      // if either number is zero, percentage won't calculate correctly
      if (expensesSum == 0) {
         // 100 of expenses are covered by local
         data.localPercentage = 100;
      } else if (localIncomeSum == 0) {
         // there is no local income, so so no expenses are covered
         data.localPercentage = 0;
      }

      data.monthOptions = GetMonthList(AB);

      return data;
   },
   template: () => {
      return fs.readFileSync(
         path.join(__dirname, "templates", "local-income-expense.ejs"),
         "utf8"
      );
   },
};

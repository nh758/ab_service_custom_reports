const path = require("path");
const fs = require("fs");

const OBJECT_IDS = {
   FY_MONTH: "1d63c6ac-011a-4ffd-ae15-97e5e43f2b3f",
   BALANCE: "bb9aaf02-3265-4b8c-9d9a-c0b447c2d804",
};

const QUERY_IDS = {
   MyTeamRC: "241a977c-7748-420d-9dcb-eff53e66a43f",
   MyQXRC: "2e3e423b-fcec-4221-9a9c-7a670fbba65e",
};

function GetViewDataBalanceReport(rc, fyMonth) {
   return {
      title: {
         en: "RC Balances",
         zh: "",
      },
      fnValueFormat: valueFormat,
      rcType: rc,
      fyPeriod: fyMonth,
      fyOptions: [],
      items: [],
   };
}

function GetRC(AB, queryId) {
   const queryRC = AB.queryByID(queryId).model();

   if (queryRC == null) return Promise.resolve([]);

   return new Promise((next, bad) => {
      queryRC
         .findAll({}, { user: AB.id }, AB.req)
         .then((list) => {
            let rcNames = (list || []).map((rc) => rc["BASE_OBJECT.RC Name"]);

            rcNames = rcNames.sort((a, b) =>
               a.toLowerCase().localeCompare(b.toLowerCase())
            );

            next(rcNames);
         })
         .catch(bad);
   });
}

function GetFYMonths(AB) {
   // const objFYMonth = ABSystemObject.getApplication().objects(
   //    (o) => o.id == OBJECT_IDS.FY_MONTH
   // )[0];
   const objFYMonth = AB.objectByID(OBJECT_IDS.FY_MONTH).model();

   if (objFYMonth == null) {
      return Promise.resolve([]);
   }

   return new Promise((next, bad) => {
      objFYMonth
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
         )
         .then((list) => {
            next(list.map((item) => item["FY Per"]));
         })
         .catch(bad);
   });
}

function GetBalances(AB, rc, fyPeriod, extraRules = []) {
   // const objBalance = ABSystemObject.getApplication().objects(
   //    (o) => o.id == OBJECT_IDS.BALANCE
   // )[0];
   const objBalance = AB.objectByID(OBJECT_IDS.BALANCE).model();

   if (objBalance == null || fyPeriod == null) {
      return Promise.resolve([]);
   }

   let cond = {
      glue: "and",
      rules: [],
   };

   if (rc) {
      cond.rules.push({
         key: "RC Code",
         rule: "equals",
         value: rc,
      });
   }

   if (fyPeriod) {
      cond.rules.push({
         key: "FY Period",
         rule: "equals",
         value: fyPeriod,
      });
   }

   (extraRules || []).forEach((r) => {
      if (!r) return;

      cond.rules.push(r);
   });

   return new Promise((next, bad) => {
      objBalance
         .findAll(
            {
               where: cond,
               populate: true,
            },
            { user: AB.id },
            AB.req
         )
         .then((list) => {
            next(list);
         })
         .catch(bad);
   });
}

function valueFormat(number) {
   if (number == null) return;

   return number.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

module.exports = {
   // GET: /template/balanceReport
   // balanceReport: (req, res) => {
   prepareData: async (AB, { rc, fyper }) => {
      let viewData = GetViewDataBalanceReport(rc, fyper);

      /**
       * {
       *    rcName1: sum of balances,
       *    rcName2: sum of balances,
       *    ...
       * }
       */
      let rcHash = {};

      return (
         Promise.resolve()
            // Pull FY month list
            .then(
               () =>
                  new Promise((next, err) => {
                     GetFYMonths(AB)
                        .then((list) => {
                           viewData.fyOptions = list;
                           next();
                        })
                        .catch(err);
                  })
            )
            // Check QX Role of the user
            .then(
               () =>
                  new Promise((next, err) => {
                     GetRC(
                        AB,
                        viewData.rcType == "qx" // this is the rc from GET
                           ? QUERY_IDS.MyQXRC
                           : QUERY_IDS.MyTeamRC
                     )
                        .then((list) => {
                           next(list || []);
                        })
                        .catch(err);
                  })
            )
            // Pull Balance
            .then(
               (RCs) =>
                  new Promise((next, err) => {
                     let rules = [
                        {
                           key: "RC Code",
                           rule: "in",
                           value: RCs,
                        },
                        {
                           key: "COA Num",
                           rule: "in",
                           value: [3991, 3500],
                        },
                     ];

                     GetBalances(
                        AB,
                        null,
                        viewData.fyPeriod || viewData.fyOptions[0],
                        rules
                     )
                        .then((list) => {
                           next(list);
                        })
                        .catch(err);
                  })
            )
            // Render UI
            .then((balances) => {
               // Calculate Sum
               (balances || []).forEach((gl) => {
                  rcHash[gl["RC Code"]] =
                     rcHash[gl["RC Code"]] == null ? 0 : rcHash[gl["RC Code"]];

                  rcHash[gl["RC Code"]] += gl["Running Balance"] || 0;
               });

               // Convert to View Data
               Object.keys(rcHash).forEach((rcCode) => {
                  viewData.items.push({
                     title: rcCode,
                     value: rcHash[rcCode],
                  });
               });

               // Sort
               viewData.items = viewData.items.sort((a, b) =>
                  a.title.toLowerCase().localeCompare(b.title.toLowerCase())
               );
            })
            .then(() => {
               return viewData;
            })
      );
   },
   template: () => {
      return fs.readFileSync(
         path.join(__dirname, "templates", "balance-report.ejs"),
         "utf8"
      );
   },
};

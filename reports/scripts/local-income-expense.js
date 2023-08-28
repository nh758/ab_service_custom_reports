const AB = parent.AB;
const $$ = parent.AB.Webix.$$;
const dom_id = "local-income-expense-report";

const ids = {
   myTeamsQueryId: "62a0c464-1e67-4cfb-9592-a7c5ed9db45c",
   myRCsQueryId: "241a977c-7748-420d-9dcb-eff53e66a43f",
   myRCsTeamFieldId: "ae4ace97-f70c-4132-8fa0-1a0b1a9c7859",
   balanceObjId: "bb9aaf02-3265-4b8c-9d9a-c0b447c2d804",
   monthObjId: "1d63c6ac-011a-4ffd-ae15-97e5e43f2b3f",

   teamViewId: `${dom_id}_team`,
   rcViewId: `${dom_id}_rc`,
   monthViewId: `${dom_id}_month`,
};

async function ui() {
   const report_dom = parent.document.getElementById(dom_id);
   const elem_id = `${dom_id}_webix`;

   if ($$(elem_id) && report_dom.innerHTML) {
      _attachEvents();
      return;
   }

   AB.Webix.ui({
      id: elem_id,
      container: report_dom,
      view: "layout",
      rows: [
         // Title
         {
            view: "label",
            align: "center",
            label: "<h1><%= title[languageCode] %></h1>",
            height: 80,
         },
         // Options
         {
            cols: [
               { fillspace: true },
               {
                  id: ids.teamViewId,
                  view: "multiselect",
                  placeholder: "[Select]",
                  label: "Ministry Team:",
                  labelWidth: 110,
                  width: 300,
                  options: [],
               },
               {
                  id: ids.rcViewId,
                  view: "multiselect",
                  placeholder: "[All]",
                  label: "RC:",
                  labelWidth: 50,
                  width: 250,
                  options: [],
               },
               {
                  id: ids.monthViewId,
                  view: "multiselect",
                  placeholder: "[Select]",
                  label: "FY Period:",
                  labelWidth: 80,
                  width: 250,
                  options: [],
               },
               { fillspace: true },
            ],
         },
      ],
   });

   await loadOptions();
   _attachEvents();
}

function _attachEvents() {
   const $team = $$(ids.teamViewId),
      $rc = $$(ids.rcViewId),
      $month = $$(ids.monthViewId);

   if ($team.__onChange) $team.detachEvent($team.__onChange);
   if ($rc.__onChange) $rc.detachEvent($rc.__onChange);
   if ($month.__onChange) $month.detachEvent($month.__onChange);

   $team.__onChange = $team.attachEvent("onChange", async () => {
      await _defineRcOptions();
      refresh();
   });
   $rc.__onChange = $rc.attachEvent("onChange", () => {
      refresh();
   });
   $month.__onChange = $month.attachEvent("onChange", () => {
      refresh();
   });
}

async function loadOptions() {
   const myTeams = AB.queryByID(ids.myTeamsQueryId).model();
   const monthObj = AB.objectByID(ids.monthObjId).model();

   // Load Options
   const [teams, months] = await Promise.all([
      // return teams
      myTeams.findAll({
         populate: false,
      }),
      // return year
      monthObj.findAll({
         populate: false,
      }),
   ]);

   _defineOptions(
      ids.teamViewId,
      (teams && teams.data) || [],
      "BASE_OBJECT.Name"
   );
   _defineRcOptions();
   _defineOptions(ids.monthViewId, (months && months.data) || [], "FY Per");
}

async function _defineRcOptions() {
   const Teams = $$(ids.teamViewId).getValue();
   const myRCs = AB.queryByID(ids.myRCsQueryId).model();
   const teamCond = {
      glue: "or",
      rules: [],
   };

   (Teams || "").split(",").forEach((team) => {
      teamCond.rules.push({
         key: ids.myRCsTeamFieldId,
         rule: "equals",
         value: team,
      });
   });

   const rcs = await myRCs.findAll({
      where: teamCond,
      populate: false,
   });

   $$(ids.rcViewId).blockEvent();
   $$(ids.rcViewId).setValue([]);
   _defineOptions(ids.rcViewId, (rcs && rcs.data) || [], "BASE_OBJECT.RC Name");
   $$(ids.rcViewId).unblockEvent();
}

function _defineOptions(webixId, options, propertyName) {
   $$(webixId).define(
      "options",
      options
         .map((t) => t[propertyName])
         .filter((team, ft, tl) => tl.indexOf(team) == ft)
         .sort(_sort)
         .map((opt) => {
            return {
               id: opt,
               value: opt,
            };
         })
   );
}

function _sort(a, b) {
   a = a || "";
   b = b || "";
   return a.toLowerCase().localeCompare(b.toLowerCase());
}

function refresh() {
   const $team = $$(ids.teamViewId),
      $rc = $$(ids.rcViewId),
      $month = $$(ids.monthViewId);

   const teamVal = $team.getValue(),
      rcVal = $rc.getValue(),
      monthVal = $month.getValue();

   const iFrame = parent.document.getElementById(
      "local-income-expense-report-frame"
   );
   iFrame.src = `/report/local-income-expense?Teams=${teamVal}&RCs=${rcVal}&fyMonth=${monthVal}`;
}

ui();

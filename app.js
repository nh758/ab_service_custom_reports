//
// custom_reports
// A cool micro service.
//
const AB = require("ab-utils");

var controller = AB.controller("custom_reports");
// controller.afterStartup((req, cb)=>{ return cb(/* err */) });
// controller.beforeShutdown((req, cb)=>{ return cb(/* err */) });
// controller.waitForDB = true; // {bool} wait for mysql to be accessible before .init() is processed
controller.init();

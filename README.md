[![buildoncommit](https://github.com/digi-serve/ab_service_custom_reports/actions/workflows/build-on-commit.yml/badge.svg)](https://github.com/digi-serve/ab_service_custom_reports/actions/workflows/build-on-commit.yml) [![Total alerts](https://img.shields.io/lgtm/alerts/g/digi-serve/ab_service_custom_reports.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/digi-serve/ab_service_custom_reports/alerts/) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/digi-serve/ab_service_custom_reports.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/digi-serve/ab_service_custom_reports/context:javascript)

# Custom Reports

Service to generate custom AppBuilder reports.

## Adding Reports

Use the appbuilder cli to add a new endpoint:

```bash
appbuilder service new custom_reports
```

The first 3 questions aren't important, but answer Y when asked to create an API endpoint.

```bash
? Create an initial API endpoint for this service? : (y/N)
```

Answer the remaining questions.

After the script finishes you will should see a handler in `/handlers`. In the created file write custom logic within the then function of `ABBootstrap.init()` to load and return html.

```js
ABBootstrap.init(req).then(async (AB) => {
   // Prepare and return html
   ejs.renderFile(templatePath, data, {}, (err, html) => {
      if (err) {
         cb(err);
      } else {
         cb(null, html);
      }
   });
});
```

Store your ejs template in `/templates`.

You will also need to edit the controller added in `api_sails/api/controllers/custom_reports` to pass on the retuned html.

```js
req.ab.serviceRequest("custom_reports.report", jobData, (err, results) => {
   if (err) {
      res.ab.error(err);
      return;
   }
   // Add this:
   res.status("200");
   res.send(results);
});
```

## How do I see my edits?

in root directory run this
`./restart.sh custom_reports`
To debug:
Add this code to the override or docker-compose

```
  custom_reports:
    ports:
      - "9229:9229"
```
If it isn't found, try port forwarding in chrome://inspect
### Other notes:

July/2022
It seems that this service will just not start up if there are any problems with the sub-reports.

report/well-invoice?payeeId=2
http://127.0.0.1:8088/report/income-vs-expense?fyper=FY22%20M12
http://127.0.0.1:8088/report/local-income-expense?rc=RC%20Center%20flush&fiscalPeriod=FY22%20M12
http://127.0.0.1:8088/report/balance-sheet?rc=RC%20Center%20flush&month=FY22%20M12

In order to test: Make sure that the objects exist on your local, otherwise `AB.objectByID().object()` will throw an exception
### How do I enable custom reports?

Add this to your root /config/local.js and run configReset.sh:

```custom_reports: {
   enable: true,
},
```
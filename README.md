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

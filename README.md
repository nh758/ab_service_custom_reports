# ab_service_custom_reports

## A cool micro service.

### To add new report put:

prepareData in `/reports/<your-report>.js`
templates in `/reports/templates/<your-template>.ejs`

Add paths to these files to `reports()` in this file:
`/handlers/report.js`

### How do I enable custom reports?

Add this to your root /config/local.js and run configReset.sh:

```custom_reports: {
   enable: true,
},
```

## How do I see my edits?

in root directory run this
`./restart.sh custom_reports`

### Other notes:

July/2022
It seems that this service will just not start up if there are any problems with the sub-reports.

report/well-invoice?payeeId=2
http://127.0.0.1:8088/report/income-vs-expense?fyper=FY22%20M12
http://127.0.0.1:8088/report/local-income-expense?rc=RC%20Center%20flush&fiscalPeriod=FY22%20M12
http://127.0.0.1:8088/report/balance-sheet?rc=RC%20Center%20flush&month=FY22%20M12

In order to test: Make sure that the objects exist on your local, otherwise `AB.objectByID().object()` will throw an exception

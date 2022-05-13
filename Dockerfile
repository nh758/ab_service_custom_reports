##
## digiserve/custom_reports:master
##
## This is our microservice for handling all our incoming AB
## api requests.
##
## Docker Commands:
## ---------------
## $ docker build -t digiserve/custom_reports:master .
## $ docker push digiserve/custom_reports:master
##

FROM digiserve/service-cli:master

RUN git clone --recursive https://github.com/digi-serve/ab_service_custom_reports.git app && cd app && npm install

WORKDIR /app

CMD [ "node", "--inspect=0.0.0.0:9229", "app.js" ]

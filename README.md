# install loopback CLI
`npm install -g loopback-cli`

# generate the project
`slc loopback`

# install mongoDB conenctor
`npm install loopback-connector-mongodb --save`

# create our datasource
`lb datasource`

# create our model
`lb model`

# install angular 2 generator
`npm install --save-dev @mean-expert/loopback-sdk-builder`

# generate sdk angular 2 services
`./node_modules/.bin/lb-sdk server/server.js ../iot-uniovi-ui/src/app/shared/sdk`

# to start server
`npm start`

# install pm2 cluster service
`npm install -g pm2`

# to start server cluster with pm2 with 2 instances
`pm2 start server/server.js -i 2`
`pm2 restart server`
`pm2 stop server`
`pm2 monit`
`pm2 delete server`

# docker

Dentro de la carpeta docker encontraremos dos ficheros:

* make-image.sh
* run.sh

# docker-compose

Partimos de que 

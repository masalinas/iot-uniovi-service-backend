# install loopback CLI

```shell
npm install -g loopback-cli
```

# generate the project

```shell
slc loopback
```

# install mongoDB conenctor

```shell
npm install loopback-connector-mongodb --save
```

# create our datasource

```shell
lb datasource
```

# create our model

```shell
lb model
```

# install angular 2 generator

```shell
npm install --save-dev @mean-expert/loopback-sdk-builder
```

# generate sdk angular 2 services

```shell
./node_modules/.bin/lb-sdk server/server.js ../iot-uniovi-ui/src/app/shared/sdk
```

# to start server

```shell
npm start
```

# install pm2 cluster service

```shell
npm install -g pm2
```

# to start server cluster with pm2 with 2 instances

```shell
 pm2 start server/server.js -i 2
 pm2 restart server
 pm2 stop server
 pm2 monit
 pm2 delete server
```

# docker

Dentro de la carpeta docker encontraremos dos ficheros:

- make-image.sh
- run.sh

# https://github.com/nodejs/docker-node#create-a-dockerfile-in-your-nodejs-app-project
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
FROM node:alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV MONGODB_URL="localhost"
ENV MONGODB_PORT=27017
ENV MONGODB_USER="uniovi"
ENV MONGODB_PASSWORD="univo"
ENV MONGODB_DB="uniovidb"
ENV PRODUCTION=true

RUN mkdir -p /usr/src/api && chown -R node:node /usr/src/api
USER node
WORKDIR /usr/src/api

COPY package.json package.json

RUN npm install --production

COPY server server
COPY common common

CMD ["npm", "start"]

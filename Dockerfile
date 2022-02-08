FROM node:alpine

RUN mkdir -p /usr/src/api && chown -R node:node /usr/src/api
USER node
WORKDIR /usr/src/api

COPY package.json package.json

RUN npm install --production

COPY server server
COPY common common

CMD ["npm", "start"]
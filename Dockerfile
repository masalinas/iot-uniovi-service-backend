FROM node:alpine

RUN mkdir -p /usr/src/api && chown -R node:node /usr/src/api
WORKDIR /usr/src/api

COPY package.json package.json

RUN npm install --production

COPY server server
COPY common common

## Add the wait script to the image
ENV WAIT_VERSION 2.9.0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /wait
RUN chmod +x /wait

USER node

CMD /wait && npm start
FROM node:16

WORKDIR /usr/src/app

COPY ./insecure-js/* ./

RUN npm install

RUN rm /usr/local/lib/node_modules/npm/node_modules/semver/package.json

EXPOSE 3000

CMD [ "node", "server.js" ]

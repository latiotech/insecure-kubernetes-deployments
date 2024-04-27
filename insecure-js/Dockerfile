FROM node:16

WORKDIR /usr/src/app

COPY ./insecure-js/package*.json ./

RUN npm install

RUN rm /usr/local/lib/node_modules/npm/node_modules/semver/package.json

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]

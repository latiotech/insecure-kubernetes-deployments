FROM node:16

# Create /app directory and set as working directory
RUN mkdir /app
WORKDIR /app

# Add application and package
ADD ./insecure-js/package.json /app/
ADD ./insecure-js/server.js /app/ 

RUN npm install

RUN rm /usr/local/lib/node_modules/npm/node_modules/semver/package.json

EXPOSE 3000

CMD [ "node", "server.js" ]

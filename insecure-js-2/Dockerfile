FROM node:16

# Create /app directory and set as working directory
RUN mkdir /app
WORKDIR /app

# Add application files
ADD ./insecure-js/package.json /app/
ADD ./insecure-js/server.js /app/
ADD ./insecure-js/init_db.js /app/

# Install dependencies using Yarn
RUN npm install --legacy-peer-deps

EXPOSE 3000

# Run the database initialization script, then start the server
CMD ["/bin/bash", "-c", "node init_db.js && node server.js"]
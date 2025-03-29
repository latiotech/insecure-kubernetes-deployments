FROM node:16

# Create /app directory and set as working directory
RUN mkdir /app
WORKDIR /app

COPY . .

EXPOSE 3000

# Run the database initialization script, then start the server
CMD ["/bin/bash", "-c", "node init_db.js && node server.js"]
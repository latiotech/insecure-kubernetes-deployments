const http = require('http');
const _ = require('lodash');
const qs = require('querystring');
const semver = require('semver');
const JSON5 = require('json5');
const { sequelize, User, Password } = require('./init_db');

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const postData = qs.parse(body);
      let responseMessages = [];

      // Direct SQL Injection via string concatenation
      if (postData.rawSql) {
        try {
          const rawQuery = `${postData.rawSql}`; 
          responseMessages.push(`<p>Executing raw SQL query: ${rawQuery}</p>`);
          const result = await sequelize.query(rawQuery, { type: sequelize.QueryTypes.SELECT });

          if (result.length > 0) {
            responseMessages.push(`<p>Query returned ${result.length} row(s):</p>`);
            responseMessages.push(`<pre>${JSON.stringify(result, null, 2)}</pre>`);
          } else {
            responseMessages.push(`<p>No results found</p>`);
          }
        } catch (error) {
          console.error("Raw SQL error:", error);
          responseMessages.push(`<p>An error occurred: ${error.message}</p>`);
        }
      }

      // SQL Injection via Sequelize findAll function - CVE-2019-10748
      if (postData.username) {
        try {
          responseMessages.push(`<p>Executing Sequelize query with username: ${postData.username}</p>`);
          // Vulnerable code: unsanitized input being directly passed to the where clause
          const users = await User.findAll({
            where: sequelize.literal(`username = "${postData.username}"`)
          });

          console.log("Sequelize query result:", users.map(u => u.toJSON()));  // Debugging line

          if (users.length > 0) {
            responseMessages.push(`<p>Found ${users.length} user(s):</p>`);
            responseMessages.push(`<ul>${users.map(user => `<li>Username: ${user.username}, Email: ${user.email}</li>`).join('')}</ul>`);
          } else {
            responseMessages.push(`<p>No users found</p>`);
          }
        } catch (error) {
          console.error("Sequelize error:", error);
          responseMessages.push(`<p>An error occurred: ${error.message}</p>`);
        }
      }

      // Process template input for lodash vulnerability CVE-2021-23337
      if (postData.template) {
        try {
          const compiled = _.template(postData.template);
          const output = compiled({});
          console.log("Template output:", output);
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
          const maliciousInput = postData.versionRange + "a".repeat(50000);
          for (let i = 0; i < 10; i++) {
            semver.validRange(maliciousInput);
          }
          const end = Date.now();
          const timeTaken = end - start;
          responseMessages.push(`<p>Processed malicious version range 10 times. Time taken: ${timeTaken}ms.</p>`);
        
          // Add a comparison with a non-malicious input
          const safeStart = Date.now();
          for (let i = 0; i < 10; i++) {
            semver.validRange('1.x || >=2.5.0 || 5.0.0 - 7.2.3');
          }
          const safeEnd = Date.now();
          const safeTimeTaken = safeEnd - safeStart;
          responseMessages.push(`<p>Processed safe version range 10 times. Time taken: ${safeTimeTaken}ms.</p>`);
        
          responseMessages.push(`<p>Difference: ${timeTaken - safeTimeTaken}ms</p>`);
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
          console.log("Parsed JSON5 object:", parsedObject);
        
          // Check for prototype pollution
          if (({}).polluted === "Prototype pollution successful!") {
            responseMessages.push(`<p>Prototype pollution detected: ${({}).polluted}</p>`);
          } else if (parsedObject.__proto__ && parsedObject.__proto__.polluted) {
            responseMessages.push(`<p>Prototype pollution detected on parsed object: ${parsedObject.__proto__.polluted}</p>`);
          } else {
            responseMessages.push(`<p>No prototype pollution detected.</p>`);
          }
        
          // Additional checks
          if (parsedObject.regularProperty) {
            responseMessages.push(`<p>Regular property: ${parsedObject.regularProperty}</p>`);
          }
          if (Object.prototype.hasOwnProperty('polluted')) {
            responseMessages.push(`<p>Global Object prototype polluted!</p>`);
          }
        } catch (error) {
          console.error(error);
          responseMessages.push(`<p>An error occurred while processing the JSON5 data: ${error.message}</p>`);
        }
      }

      // Send combined response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(responseMessages.join('') + `<p><a href="/">Go back</a></p>`);
    });
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h2 {
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            h3 {
              color: #444;
              margin-top: 20px;
            }
            form > div {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f4f4f4;
              border-radius: 5px;
            }
            label {
              display: block;
              margin-bottom: 5px;
            }
            input[type="text"], textarea {
              width: 100%;
              padding: 8px;
              margin-bottom: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            small {
              display: block;
              color: #666;
              font-style: italic;
            }
            input[type="submit"] {
              background-color: #4CAF50;
              color: white;
              padding: 10px 15px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            input[type="submit"]:hover {
              background-color: #45a049;
            }
          </style>
        </head>
        <body>
          <h2>Package Vulnerability Demo</h2>
          <form action="/" method="POST">
            <div>
              <h3>1. Direct SQL Injection</h3>
              <label for="rawSql">SQL Query:</label>
              <input type="text" id="rawSql" name="rawSql" placeholder="Enter SQL query" style="width: 100%;">
              <small>Try these payloads:
                <ul>
                  <li><code>SELECT name FROM sqlite_master WHERE type='table';</code> (List all tables)</li>
                  <li><code>SELECT * FROM Users JOIN Passwords ON Users.id = Passwords.userId;</code> (Join Users and Passwords)</li>
                  <li><code>SELECT sql FROM sqlite_master WHERE type='table';</code> (Show table schemas)</li>
                </ul>
              </small>
            </div>
            <div>
              <h3>2. Sequelize SQL Injection (CVE-2019-10748)</h3>
              <label for="username">Username (for Sequelize Injection):</label>
              <input type="text" id="username" name="username" placeholder="Enter username">
              <small>Try payloads:
                <ul>
                  <li><code>nonexistentuser" OR 1=1 --</code></li>
                  <li><code>admin"; DROP TABLE Users; --</code></li>
                </ul>
              </small>
            </div>
            <div>
              <h3>3. Lodash Template Processing (CVE-2021-23337)</h3>
              <label for="template">Template String:</label>
              <textarea id="template" name="template" rows="4"></textarea>
              <small>Try payload: <code><%= global.process.mainModule.require('child_process').execSync('ls -la') %></code></small>
            </div>
            <div>
              <h3>4. Semver ReDoS Vulnerability (CVE-2022-25883)</h3>
              <label for="versionRange">Version Range:</label>
              <input type="text" id="versionRange" name="versionRange" placeholder="Enter version range">
              <small>Try payload: <code>^((((((((((((((((((a)?){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2}){2})*$</code></small>
            </div>
            <div>
              <h3>5. JSON5 Prototype Pollution (CVE-2022-46175)</h3>
              <label for="json5data">JSON5 Data:</label>
              <textarea id="json5data" name="json5data" rows="4">
{
  "__proto__": { "polluted": "Prototype pollution successful!" }
}
              </textarea>
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

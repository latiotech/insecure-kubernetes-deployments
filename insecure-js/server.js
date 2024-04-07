const http = require('http');
const _ = require('lodash');
const qs = require('querystring');
const semver = require('semver');
const JSON5 = require('json5')   

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const postData = qs.parse(body);
      let responseMessages = [];

      // Process template input for lodash vulnerability CVE-2021-23337 - lodash injection
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

      // Process version range input for semver ReDoS vulnerability //CVE-2022-25883 - semver redos and phantom package
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

      // CVE-2022-46175 Prototype Polution from JSON5 showing phantom package
      if (postData.json5data) {
        try {
          // Parse the JSON5 data, which may include prototype pollution
          const parsedObject = JSON5.parse(postData.json5data);
      
          // Create a new object that inherits from the parsedObject
          // This step is crucial to demonstrate the prototype pollution, as it will inherit any polluted properties
          const testObject = Object.create(parsedObject);
      
          // Now, check if the prototype pollution has been successful by checking the new object
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
          <h2>Lodash Template and Semver Range Vulnerability Demo</h2>
          <form action="/" method="POST">
            <div>
              <label for="template">Template:</label><br>
              <textarea id="template" name="template" rows="4" cols="50">\<% console.log('This will log to the server console'); %>\</textarea><br>
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
          <p>Submit to execute the vulnerable lodash template function or to validate a version range with semver on the server.</p>
        </body>
      </html>
    `);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

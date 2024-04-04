const http = require('http');
const _ = require('lodash');
const qs = require('querystring');
const semver = require('semver');

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

      // Process template input for lodash vulnerability CVE-2021-23337 - iodash injection
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

//CVE-2021-23337

const http = require('http');
const _ = require('lodash');
const url = require('url');
const qs = require('querystring');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    // Handle form submission. 
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Convert Buffer to string.
    });
    req.on('end', () => {
      const postData = qs.parse(body);
      try {
        // Here's where the vulnerable lodash template execution happens.
        // The template string is taken from the form input.
        const compiled = _.template(postData.template);
        compiled({});
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<p>Executed template. Check server console for output.</p><a href="/">Go back</a>`);
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<p>An error occurred: ${error.message}</p><a href="/">Go back</a>`);
      }
    });
  } else if (req.method === 'GET') {
    // Serve an HTML page with a form pre-filled with the exploitation code.
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h2>Lodash Template Vulnerability Demo</h2>
          <form action="/" method="POST">
            <label for="template">Template:</label><br>
            <textarea id="template" name="template" rows="4" cols="50">\<% console.log('This will log to the server console'); %>\
            </textarea><br>
            <input type="submit" value="Submit">
          </form>
          <p>Submit to execute the vulnerable lodash template function on the server.</p>
        </body>
      </html>
    `);
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

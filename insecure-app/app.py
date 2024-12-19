from flask import Flask, request, render_template_string, jsonify
import subprocess
import os
import sqlite3
import requests
from lxml import etree
from security import safe_command

# Example hardcoded AWS credentials (sensitive data leakage)
aws_access_key_id = 'AKIA2JAPX77RGLB664VE'
aws_secret = 'v5xpjkWYoy45fGKFSMajSn+sqs22WI2niacX9yO5'

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    output = ''
    # 1 - SQL Injection
    db = sqlite3.connect("tutorial.db")
    cursor = db.cursor()
    username = ''
    password = ''
    try:
        cursor.execute("SELECT * FROM users WHERE username = '%s' AND password = '%s'" % (username, password))
    except:
        pass

    if request.method == 'POST':
        # 2 - Command Injection
        if 'command' in request.form:
            cmd = request.form['command']
            process = safe_command.run(subprocess.Popen, cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()
            if process.returncode == 0:
                output = stdout.decode('utf-8')
            else:
                output = f"Error (Exit Code: {process.returncode}):\n{stderr.decode('utf-8')}"

        # 3 - File Upload with no restrictions, and path traversal
        elif 'file' in request.files:
            uploaded_file = request.files['file']
            uploaded_file.save(os.path.join('/uploads', uploaded_file.filename))
            output = f"File {uploaded_file.filename} uploaded successfully!"

        # 4 - SQL Injection via input
        elif 'sql' in request.form:
            sql = request.form['sql']
            try:
                # Execute the user's SQL query
                cursor.execute(sql)
                # Fetch all rows from the query result
                rows = cursor.fetchall()
                # Format the results for display
                if rows:
                    output = "Results:\n" + "\n".join(str(row) for row in rows)
                else:
                    output = "Query executed successfully, but no results found."
            except Exception as e:
                output = f"SQL Error: {e}"

        # 5 - Cross-Site Scripting (XSS)
        elif 'xss' in request.form:
            xss_input = request.form['xss']
            output = f"Reflected XSS result: {xss_input}"

        # 6 - XML External Entity (XXE) Injection
        elif 'xml' in request.form:
            xml_data = request.form['xml']
            try:
                # Use lxml to parse the XML data
                parser = etree.XMLParser(load_dtd=True, resolve_entities=True)
                tree = etree.fromstring(xml_data.encode(), parser)
                output = f"Parsed XML: {etree.tostring(tree, encoding='unicode')}"
            except Exception as e:
                output = f"XML Parsing Error: {e}"

        # 7 - Server-Side Request Forgery (SSRF)
        elif 'url' in request.form:
            url = request.form['url']
            try:
                response = requests.get(url, timeout=60)
                output = f"SSRF Response: {response.text[:200]}"
            except Exception as e:
                output = f"SSRF Error: {e}"

            # 8 - SQL injection with parameter instead of whole query
        if 'username' in request.form:
            username = request.form['username']
            try:
                # Vulnerable SQL query using string interpolation
                query = "SELECT password FROM users WHERE username = '{}'".format(username)
                cursor.execute(query)
                result = cursor.fetchone()
                if result:
                    output = f"Password for {username}: {result[0]}"
                else:
                    output = "User not found."
            except Exception as e:
                output = f"SQL Error: {e}"

    return render_template_string("""
        <h1>Intentionally Insecure App</h1>
        <hr>

        <!-- Command Injection -->
        <form action="/" method="post">
            <h2>Command Injection</h2>
            <input type="text" name="command" value="ls -la">
            <input type="submit" value="Run">
        </form>
        <br>

        <!-- File Upload -->
        <form action="/" method="post" enctype="multipart/form-data">
            <h2>Path Traversal via File Upload</h2>
            <input type="file" name="file">
            <input type="submit" value="Upload">
        </form>
        <p>Try uploading a file named: <code>../../../../etc/passwd</code></p>
        <br>

        <!-- SQL Injection -->
        <form action="/" method="post">
            <h2>SQL Injection</h2>
            <input type="text" name="sql" value="SELECT * FROM users WHERE username = 'admin' OR '1'='1'">
            <input type="submit" value="Run">
        </form>
        <br>

        <!-- Cross-Site Scripting (XSS) -->
        <form action="/" method="post">
            Enter XSS payload: <input type="text" name="xss" value="<script>alert('XSS');</script>">
            <input type="submit" value="Run">
        </form>
        <br>

        <!-- XML External Entity (XXE) Injection -->
        <form action="/" method="post">
            <h2>XML External Entity (XXE) Injection</h2>
            <textarea name="xml" rows="5" cols="50">
<?xml version="1.0"?>
<!DOCTYPE root [
<!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
            </textarea>
            <input type="submit" value="Parse XML">
        </form>
        <br>

        <!-- Server-Side Request Forgery (SSRF) -->
        <form action="/" method="post">
            <h2>Server-Side Request Forgery (SSRF)</h2>
            <input type="text" name="url" value="http://localhost:8080/">
            <input type="submit" value="Request">
        </form>
        <br>
        <!-- SQL Injection 2 -->
        <h2>SQL Injection 2</h2>
        <form action="/" method="post">
            Enter Username: <input type="text" name="username" value="' UNION SELECT username || ' : ' || password FROM users --">
            <input type="submit" value="Lookup">
        </form>
        <hr>
        <pre>{{ output|safe }}</pre>
    """, output=output)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)

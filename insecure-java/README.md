# **Cat Picture App \- Vulnerable Application for Educational Purposes**

Welcome to the **Cat Picture App**, an intentionally vulnerable web application designed for educational purposes to demonstrate common security vulnerabilities as outlined in the OWASP Top 10\. This application allows users to explore how these vulnerabilities can manifest in real-world applications and understand the importance of secure coding practices.

---

## **Table of Contents**

* Introduction  
* Getting Started  
  * Prerequisites  
  * Installation  
  * Running the Application  
* Vulnerabilities  
  * 1\. Injection (SQL Injection)  
  * 2\. Broken Authentication  
  * 3\. Sensitive Data Exposure  
  * 4\. XML External Entities (XXE)  
  * 5\. Broken Access Control  
  * 6\. Security Misconfiguration  
  * 7\. Cross-Site Scripting (XSS)  
  * 8\. Insecure Deserialization  
  * 9\. Using Components with Known Vulnerabilities  
  * 10\. Insufficient Logging & Monitoring  
  * 11\. Insecure Direct Object References (IDOR)  
  * 12\. Cross-Site Request Forgery (CSRF)  
* Important Notes  
* Learning Resources  
* License

---

## **Introduction**

The Cat Picture App is a simple web application that allows users to register, log in, add comments, search for cat pictures, and manage profiles. It intentionally contains multiple security vulnerabilities to help developers and security enthusiasts learn about common web application security issues.

---

## **Getting Started**

### **Prerequisites**

* **Java Development Kit (JDK)**: Version 11 or higher  
* **Gradle**: Version 6.x or higher  
* **Internet Connection**: To download dependencies

### **Installation**

**Clone the Repository**  
bash  
Copy code  
`git clone https://github.com/yourusername/cat-picture-app.git`

1. 

**Navigate to the Project Directory**  
bash  
Copy code  
`cd cat-picture-app`

2. 

**Build the Project**  
bash  
Copy code  
`./gradlew clean build`

3. 

### **Running the Application**

**Using Gradle**  
bash  
Copy code  
`./gradlew bootRun`

* 

**Access the Application**  
Open your web browser and navigate to:  
arduino  
Copy code  
`http://localhost:8080/`

* 

---

## **Vulnerabilities**

Below is a detailed list of the vulnerabilities present in this application, along with their locations and examples of how they can be exploited.

---

### **1\. Injection (SQL Injection)**

#### **Description**

The application is vulnerable to SQL Injection, allowing attackers to manipulate database queries by injecting malicious SQL code through user inputs.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/CatPictureController.java`  
* **Method:** `public String search(@RequestParam String name, Model model)`

#### **Vulnerable Code**

java  
Copy code  
`String query = "SELECT * FROM cat_pictures WHERE name = '" + name + "'";`  
`List<CatPicture> results = catPictureRepository.findByNameQuery(query);`

#### **How to Exploit**

**Navigate to the Search Page**  
bash  
Copy code  
`http://localhost:8080/search`

1. 

**Enter Malicious Input**  
In the **Name** field, enter:  
bash  
Copy code  
`' OR '1'='1`

2.   
3. **Submit the Form**  
   Click on the **Search** button.

#### **Impact**

* Attackers can bypass authentication mechanisms.  
* Unauthorized access to data.  
* Data manipulation or deletion.

#### **Mitigation**

* Use parameterized queries or prepared statements.  
* Validate and sanitize user inputs.

---

### **2\. Broken Authentication**

#### **Description**

The application has weak authentication mechanisms, storing passwords in plaintext and lacking proper session management.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/UserController.java`  
* **Methods:**  
  * `public String register(@RequestParam String username, @RequestParam String password, Model model)`  
  * `public String login(@RequestParam String username, @RequestParam String password, Model model)`

#### **Vulnerable Code**

java  
Copy code  
`// Storing password in plaintext`  
`user.setPassword(password);`  
`userRepository.save(user);`

#### **How to Exploit**

1. **Register with a Simple Password**  
   * Username: `user1`  
   * Password: `password123`  
2. **Login Using the Credentials**  
   * The password is stored in plaintext, making it vulnerable if the database is compromised.

#### **Impact**

* Attackers can easily compromise user accounts.  
* Increased risk if database access is obtained.

#### **Mitigation**

* Store passwords securely using hashing algorithms like BCrypt.  
* Implement secure session management.  
* Enforce strong password policies.

---

### **3\. Sensitive Data Exposure**

#### **Description**

Sensitive data such as passwords are stored and transmitted insecurely.

#### **Location**

* **File:** `src/main/java/com/example/catapp/models/User.java`

#### **Vulnerable Code**

java  
Copy code  
`private String password; // Password stored in plaintext`

#### **How to Exploit**

* If an attacker gains access to the database, they can read all user passwords.

#### **Impact**

* User accounts can be compromised.  
* Potential for credential reuse attacks on other services.

#### **Mitigation**

* Encrypt sensitive data at rest and in transit.  
* Implement proper access controls.  
* Use HTTPS for secure communication.

---

### **4\. XML External Entities (XXE)**

*Note: This vulnerability is not explicitly implemented in the application but is mentioned here for completeness.*

#### **Description**

XXE attacks exploit vulnerabilities in XML parsers to access or manipulate data.

#### **Mitigation**

* Disable external entity processing in XML parsers.  
* Use less complex data formats like JSON.

---

### **5\. Broken Access Control**

#### **Description**

The application lacks proper access control, allowing users to perform actions without authorization.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/CatPictureController.java`  
* **Method:** `public String deletePicture(@RequestParam int id, Model model)`

#### **Vulnerable Code**

java  
Copy code  
`catPictureRepository.deleteById(id);`

#### **How to Exploit**

**Navigate to the Delete Picture Page**  
bash  
Copy code  
`http://localhost:8080/delete`

1.   
2. **Enter Picture ID**  
   * Enter `1` in the **Picture ID** field.  
3. **Submit the Form**  
   * Click on the **Delete** button.

#### **Impact**

* Unauthorized deletion of resources.  
* Data loss or corruption.

#### **Mitigation**

* Implement authorization checks.  
* Verify user permissions before performing actions.

---

### **6\. Security Misconfiguration**

#### **Description**

The application exposes detailed error messages and lacks proper security headers.

#### **Location**

* **File:** `src/main/java/com/example/catapp/config/GlobalExceptionHandler.java`  
* **File:** `src/main/resources/application.properties`

#### **Vulnerable Code**

java  
Copy code  
`// Exposing detailed error messages`  
`@ResponseBody`  
`public String handleAllExceptions(Exception ex) {`  
    `return ex.getMessage(); // Detailed exception message`  
`}`

properties  
Copy code  
`# Disabling security headers`  
`spring.security.headers.content-security-policy=none`  
`spring.security.headers.x-content-type-options=none`  
`spring.security.headers.x-frame-options=none`  
`spring.security.headers.x-xss-protection=0`

#### **How to Exploit**

* Trigger an error (e.g., access an undefined endpoint) to view detailed stack traces.  
* Absence of security headers increases risk of attacks like clickjacking.

#### **Impact**

* Provides valuable information to attackers.  
* Increased susceptibility to certain attacks.

#### **Mitigation**

* Configure global exception handling to show generic error messages.  
* Enable and properly configure security headers.

---

### **7\. Cross-Site Scripting (XSS)**

#### **Description**

User inputs are not sanitized, allowing attackers to inject malicious scripts.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/CommentController.java`  
* **Template:** `src/main/resources/templates/comments.html`

#### **Vulnerable Code**

html  
Copy code  
`<!-- Using th:utext renders unsanitized HTML content -->`  
`<li th:each="comment : ${comments}" th:utext="${comment.text}"></li>`

#### **How to Exploit**

**Navigate to the Add Comment Page**  
bash  
Copy code  
`http://localhost:8080/addComment`

1. 

**Enter Malicious Input**  
php  
Copy code  
`<script>alert('XSS Attack');</script>`

2.   
3. **Submit the Form**  
   * Click on the **Add Comment** button.  
4. **View Comments**  
   * Navigate to `http://localhost:8080/comments`  
   * The script will execute.

#### **Impact**

* Execution of arbitrary scripts in users' browsers.  
* Theft of user data or session hijacking.

#### **Mitigation**

* Sanitize and encode user inputs.  
* Use `th:text` instead of `th:utext` in Thymeleaf templates.

---

### **8\. Insecure Deserialization**

*Note: Not explicitly implemented but included for educational purposes.*

#### **Description**

Insecure deserialization can lead to remote code execution or privilege escalation.

#### **Mitigation**

* Avoid deserializing untrusted data.  
* Use secure serialization mechanisms.

---

### **9\. Using Components with Known Vulnerabilities**

#### **Description**

Outdated dependencies may contain known vulnerabilities.

#### **Location**

* **File:** `build.gradle`

#### **Vulnerable Code**

gradle  
Copy code  
`dependencies {`  
    `// Using outdated versions`  
    `implementation 'org.springframework.boot:spring-boot-starter-web:2.7.3'`  
`}`

#### **How to Exploit**

* Attackers can exploit known vulnerabilities in outdated libraries.

#### **Impact**

* Compromise of the application through library exploits.

#### **Mitigation**

* Regularly update dependencies.  
* Use tools to monitor for known vulnerabilities.

---

### **10\. Insufficient Logging & Monitoring**

#### **Description**

The application lacks proper logging and monitoring, hindering detection of security breaches.

#### **Mitigation**

* Implement comprehensive logging.  
* Monitor logs for suspicious activities.

---

### **11\. Insecure Direct Object References (IDOR)**

#### **Description**

Users can access or modify resources by manipulating object identifiers without authorization.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/UserController.java`  
* **Methods:**  
  * `public String viewProfile(@RequestParam int userId, Model model)`  
  * `public String editProfile(@RequestParam int userId, ...)`

#### **Vulnerable Code**

java  
Copy code  
`// No authorization check`  
`User user = userRepository.findById(userId).orElse(null);`

#### **How to Exploit**

**View Another User's Profile**  
bash  
Copy code  
`http://localhost:8080/profile?userId=2`

1. 

**Edit Another User's Profile**  
bash  
Copy code  
`http://localhost:8080/editProfile?userId=2`

2. 

#### **Impact**

* Unauthorized access to sensitive user data.  
* Unauthorized modification of user profiles.

#### **Mitigation**

* Implement authorization checks to ensure users can only access their own data.  
* Use session information to determine the current user.

---

### **12\. Cross-Site Request Forgery (CSRF)**

#### **Description**

The application lacks CSRF protection, allowing attackers to perform actions on behalf of authenticated users.

#### **Location**

* **File:** `src/main/java/com/example/catapp/controllers/CommentController.java`  
* **Method:** `public String deleteComment(@RequestParam int commentId, RedirectAttributes redirectAttributes)`

#### **Vulnerable Code**

java  
Copy code  
`// No CSRF token verification`  
`commentRepository.deleteById(commentId);`

#### **How to Exploit**

**Craft a Malicious HTML Page**  
html  
Copy code  
`<form action="http://localhost:8080/deleteComment" method="post">`  
    `<input type="hidden" name="commentId" value="1" />`  
`</form>`  
`<script>`  
    `document.forms[0].submit();`  
`</script>`

1.   
2. **Host the Page and Have an Authenticated User Visit It**  
   * The comment with ID `1` will be deleted without the user's consent.

#### **Impact**

* Unauthorized actions performed on behalf of users.  
* Data loss or unwanted state changes.

#### **Mitigation**

* Implement CSRF protection using tokens.  
* Use frameworks or libraries that handle CSRF automatically.

---

## **Important Notes**

* **Educational Purpose Only**  
  * This application is intentionally insecure and should only be used in controlled environments.  
  * Do not deploy this application in a production setting or expose it to untrusted networks.  
* **Ethical Use**  
  * Use this application responsibly to learn about security vulnerabilities.  
  * Do not use this knowledge for malicious purposes.

---

## **Learning Resources**

* **OWASP Top 10**  
  * OWASP Top 10 Project  
* **Secure Coding Practices**  
  * OWASP Secure Coding Practices  
* **Spring Security**  
  * [Spring Security Reference](https://docs.spring.io/spring-security/site/docs/current/reference/html5/)  
* **Thymeleaf Security**  
  * Thymeleaf Documentation  
* **CSRF Protection**  
  * Understanding CSRF Attacks

---

## **License**

This project is licensed under the MIT License \- see the LICENSE file for details.

---

**Disclaimer:** The vulnerabilities in this application are intentional and for educational purposes only. The authors are not responsible for any misuse of this application.

---

# **Additional Information**

Feel free to explore the codebase, experiment with the vulnerabilities, and most importantly, learn how to secure applications against such threats.

For any questions or suggestions, please open an issue or submit a pull request.

---

Happy Learning\!



Old - Deserialization attack
1. javac Exploit.java
2. jar cf Exploit.jar Exploit.class
3. ```curl -X POST \
  http://localhost:8080/unsafeDeserialize \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @payload.bin
```
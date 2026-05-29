# Technical Analysis of CyberShield Project

## 1. Overall Architecture (Full-Stack Application)
* **What I built:** A complete Client-Server Web Application using the **MERN** stack (MongoDB, Express, React, Node).
* **How I made it:** I separated the project into two main parts: a Frontend (User Interface) and a Backend (Server & Database). I used `concurrently` so that both the React frontend and the Node.js backend run at the exact same time during development.

## 2. Frontend Development (User Interface)
* **Technology used:** **React.js** (JavaScript Library).
* **How I used it:** 
  * I built modular "components" for each page (e.g., `Report.js`, `Dashboard.js`, `AdminLogin.js`).
  * I used React Hooks like `useState` to manage form data (like when a user types in their bullying report).
  * I styled the application using custom CSS files to make it look empathetic, accessible, and responsive.

## 3. Backend Server & REST API
* **Technology used:** **Node.js** and **Express.js**.
* **How I used it:** 
  * I created a custom web server that listens on port 3001.
  * I built a **RESTful API** with endpoints like `POST /api/register`, `POST /api/report`, and `GET /api/reports`. 
  * This allows the React frontend to securely send JSON data over HTTP to the server.

## 4. Database Design & Integration
* **Technology used:** **MongoDB** (NoSQL Database).
* **How I used it:** 
  * I used MongoDB as a flexible, document-based NoSQL database to store all application data.
  * I structured the database into collections for: `users`, `reports`, `messages`, and `groups`.
  * Using MongoDB allows the app to store complex incident reports efficiently in JSON-like documents.

## 5. Real-Time Communication & Live Updates
* **Technology used:** **MongoDB (Change Streams) & WebSockets**.
* **How I used it:** 
  * To build the live Community Support Groups, standard HTTP wasn't fast enough. I used **MongoDB's real-time capabilities** alongside WebSockets.
  * Whenever a new message is saved to the MongoDB database, it instantly detects the change and pushes that new data directly to all the other users in the chat group. This means victims and peers can talk to each other in absolute real-time without ever needing to refresh the page.

## 6. Applied Cybersecurity & User Safety
* **Technology used:** **Bcrypt** (Cryptography library).
* **How I used it:** 
  * When a user registers, I intercept their plain-text password and run it through `bcrypt.hash()`. 
  * This encrypts the password down to a scrambled string of characters before it ever touches MongoDB. Even if the database is compromised, the users' passwords remain safe.

## 7. Automated Email Microservice
* **Technology used:** **Nodemailer**.
* **How I used it:** 
  * I configured an automated email transporter securely tied to an app-specific Gmail password.
  * **Welcome Emails:** Triggered automatically upon a successful registration.
  * **Trusted Adult Alert System:** Within the report route, my code analyzes the `severity` of the bullying. It automatically generates a "Suggested Response Plan" and emails the designated Trusted Adult with the context and evidence of the incident.
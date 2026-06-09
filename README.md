# CyberShield 

An anti-cyberbullying platform where users can report incidents, chat in moderated groups, and get real-time protection against harmful content.

## Live Demo
https://anti-bullying-cybersecurity.onrender.com

##  Features
-  User registration and login
-  Real-time group chat (Socket.IO)
-  Incident reporting system
- Email alerts to parents and users
- Auto toxicity detection — blocks bad words and harmful links
- Auto account freeze for 30 minutes on violation
- Countdown timer showing unfreeze time
- Admin dashboard
- Community guidelines enforcement

## Tech Stack
- Frontend: React.js, CSS
- Backend: Node.js, Express.js, Socket.IO
- Database: MongoDB Atlas
- Email: Nodemailer
- Deployment: Render

## Testing the Freeze System
1. Register a new account
2. Join or create a group
3. Send any of these to trigger a freeze:
   - Bad word like `idiot` or `stupid`
   - Any link like `http://test.com`
   - Same message 3 times in a row (spam)
4. Account freezes for 30 minutes and email is sent

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env` file with `MONGODB_URI`, `EMAIL_USER`, `EMAIL_PASS`
4. Run `node server.js` and `npm start`

## Developer
Anusha Anil Shetty — BE Computer Science, 
SIES Graduate School of Technology